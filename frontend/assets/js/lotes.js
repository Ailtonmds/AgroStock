// Lotes JavaScript - CRUD completo

let produtosCache = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosParaSelect();
    carregarLotes();

    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('formLote').addEventListener('submit', salvarLote);
    document.getElementById('btnAplicarFiltro').addEventListener('click', carregarLotes);
    document.getElementById('btnLimparFiltro').addEventListener('click', () => {
        document.getElementById('filtroProduto').value = '';
        document.getElementById('filtroStatusValidade').value = '';
        carregarLotes();
    });

    document.getElementById('modalLote').addEventListener('hidden.bs.modal', () => {
        document.getElementById('formLote').reset();
        document.getElementById('loteId').value = '';
        document.getElementById('modalLoteLabel').textContent = 'Novo Lote';
        document.getElementById('btnSalvarLote').innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar';
        document.getElementById('btnSalvarLote').disabled = false;
        // Limpa o min da validade no modo cadastro
        document.getElementById('data_validade').min = '';
        // Esconde/reseta a identificação por código de barras
        document.getElementById('identificacaoCodigoBarras').style.display = 'none';
        document.getElementById('codigo_barras_interno').value = '';
        document.getElementById('codigo_barras_svg').src = '';
    });
});

async function carregarProdutosParaSelect() {
    try {
        const response = await apiFetch('produtos/listar.php?ativo=1');
        const data = await apiJson(response);
        if (data.sucesso) {
            produtosCache = data.dados;
            popularSelectProdutos();
        } else {
            mostrarToast('Erro ao carregar produtos.', 'danger');
        }
    } catch (e) {
        console.error('Erro ao carregar produtos:', e);
        mostrarToast('Erro ao carregar produtos.', 'danger');
    }
}

function popularSelectProdutos() {
    const selectProduto = document.getElementById('produto_id');
    const selectFiltro = document.getElementById('filtroProduto');

    const options = produtosCache.map(p =>
        `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nome)}</option>`
    ).join('');

    selectProduto.innerHTML = '<option value="">Selecione um produto</option>' + options;
    selectFiltro.innerHTML = '<option value="">Todos os produtos</option>' + options;
}

async function carregarLotes() {
    const produto_id = document.getElementById('filtroProduto').value;
    const status = document.getElementById('filtroStatusValidade').value;

    let url = 'lotes/listar.php?';
    const params = new URLSearchParams();
    if (produto_id) params.append('produto_id', produto_id);
    url += params.toString();

    const tbody = document.getElementById('tbodyLotes');

    try {
        estadoCarregando(tbody, 8);

        const response = await apiFetch(url);
        const data = await apiJson(response);

        if (!data.sucesso || !data.dados || data.dados.length === 0) {
            estadoVazio(tbody, 8, 'Nenhum lote encontrado');
            return;
        }

        let lotes = data.dados;

        // Filtrar por status de validade no frontend
        if (status) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() + 30);

            lotes = lotes.filter(l => {
                const validade = new Date(l.data_validade + 'T00:00:00');
                if (status === 'vencidos') return validade < hoje;
                if (status === 'proximos') return validade >= hoje && validade <= dataLimite;
                if (status === 'ok') return validade > dataLimite;
                return true;
            });
        }

        if (lotes.length === 0) {
            estadoVazio(tbody, 8, 'Nenhum lote encontrado com o filtro selecionado');
            return;
        }

        tbody.innerHTML = '';
        lotes.forEach(l => {
            const validade = new Date(l.data_validade + 'T00:00:00');
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() + 30);

            let statusClass = 'bg-success';
            let statusText = 'Válido';
            if (validade < hoje) {
                statusClass = 'bg-danger';
                statusText = 'Vencido';
            } else if (validade <= dataLimite) {
                statusClass = 'bg-warning text-dark';
                statusText = 'Próximo';
            }

            const tr = document.createElement('tr');

            const produtoCelula = document.createElement('td');
            produtoCelula.innerHTML = `<strong>${escapeHtml(l.produto_nome)}</strong>`;

            tr.appendChild(produtoCelula);
            tr.appendChild(montarCelula(l.numero_lote));
            tr.appendChild(montarCelula(l.codigo_barras_interno || '-'));
            tr.appendChild(montarCelula(l.data_fabricacao ? formatarDataLote(l.data_fabricacao) : '-'));
            tr.appendChild(montarCelula(formatarDataLote(l.data_validade)));
            tr.appendChild(montarCelula(l.quantidade));

            const statusCelula = document.createElement('td');
            statusCelula.className = 'text-center';
            const badgeSpan = document.createElement('span');
            badgeSpan.className = `badge ${statusClass}`;
            badgeSpan.textContent = statusText;
            statusCelula.appendChild(badgeSpan);
            tr.appendChild(statusCelula);

            const tdAcoes = document.createElement('td');
            tdAcoes.className = 'text-end';

            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn btn-sm btn-outline-primary me-1';
            btnEditar.title = 'Editar';
            btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
            btnEditar.addEventListener('click', () => editarLote(Number(l.id)));

            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn btn-sm btn-outline-danger';
            btnExcluir.title = 'Excluir';
            btnExcluir.innerHTML = '<i class="bi bi-trash"></i>';
            btnExcluir.addEventListener('click', async () => {
                const confirmado = await confirmar(
                    'Excluir lote',
                    `Tem certeza que deseja excluir o lote "${escapeHtml(l.numero_lote)}"?`
                );
                if (confirmado) await excluirLote(Number(l.id));
            });

            tdAcoes.appendChild(btnEditar);
            tdAcoes.appendChild(btnExcluir);
            tr.appendChild(tdAcoes);

            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Erro ao carregar lotes:', e);
        estadoErro(tbody, 8, 'Erro ao carregar lotes. Verifique a conexão e tente novamente.', carregarLotes);
    }
}

function abrirModalNovo() {
    document.getElementById('formLote').reset();
    document.getElementById('loteId').value = '';
    document.getElementById('modalLoteLabel').textContent = 'Novo Lote';
    document.getElementById('btnSalvarLote').innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar';
    document.getElementById('btnSalvarLote').disabled = false;
    document.getElementById('data_validade').min = formatarDataInput(new Date());
    // Esconde a identificação por código de barras no modo cadastro
    document.getElementById('identificacaoCodigoBarras').style.display = 'none';
    document.getElementById('codigo_barras_interno').value = '';
    document.getElementById('codigo_barras_svg').src = '';
}

async function editarLote(id) {
    try {
        const response = await apiFetch('lotes/listar.php');
        const data = await apiJson(response);

        if (!data.sucesso) {
            mostrarToast('Erro ao carregar dados do lote.', 'danger');
            return;
        }

        const lote = data.dados.find(l => Number(l.id) === Number(id));
        if (!lote) {
            mostrarToast('Lote não encontrado.', 'danger');
            return;
        }

        document.getElementById('loteId').value = lote.id;
        document.getElementById('produto_id').value = lote.produto_id || '';
        document.getElementById('numero_lote').value = lote.numero_lote;
        document.getElementById('data_fabricacao').value = lote.data_fabricacao || '';
        document.getElementById('data_validade').value = lote.data_validade;
        document.getElementById('quantidade').value = lote.quantidade || 1;
        // No modo edição, não restringe a data mínima
        document.getElementById('data_validade').min = '';

        document.getElementById('modalLoteLabel').textContent = 'Editar Lote';
        document.getElementById('btnSalvarLote').innerHTML = '<i class="bi bi-check-lg me-1"></i>Atualizar';

        const modal = new bootstrap.Modal(document.getElementById('modalLote'));
        modal.show();
    } catch (e) {
        console.error('Erro ao carregar lote:', e);
        mostrarToast('Erro ao carregar lote.', 'danger');
    }
}

async function salvarLote(e) {
    e.preventDefault();

    const id = document.getElementById('loteId').value;
    const isEdit = id !== '';

    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());
    dados.produto_id = parseInt(dados.produto_id);
    dados.quantidade = parseInt(dados.quantidade);

    const url = isEdit ? 'lotes/editar.php' : 'lotes/cadastrar.php';

    const btn = document.getElementById('btnSalvarLote');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

    try {
        const response = await apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const result = await apiJson(response);

        if (result.sucesso) {
            const dados = result.dados || {};
            const codigoInterno = dados.codigo_barras_interno;

            // Se é um novo lote e o código interno foi gerado, exibe a identificação no modal
            if (!isEdit && codigoInterno) {
                document.getElementById('codigo_barras_interno').value = codigoInterno;
                document.getElementById('codigo_barras_svg').src = `/backend/lotes/codigo_barras.php?id=${dados.lote_id}`;
                document.getElementById('identificacaoCodigoBarras').style.display = '';
                document.getElementById('btnSalvarLote').innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar';
                document.getElementById('btnSalvarLote').disabled = false;
                mostrarToast(`Lote cadastrado! Código interno: ${codigoInterno}`, 'success');
                // Recarrega a lista para refletir o novo lote
                carregarLotes();
                return;
            }

            bootstrap.Modal.getInstance(document.getElementById('modalLote')).hide();
            carregarLotes();
            mostrarToast(isEdit ? 'Lote atualizado com sucesso!' : 'Lote cadastrado com sucesso!', 'success');
        } else {
            mostrarToast(result.mensagem, 'danger');
        }
    } catch (error) {
        mostrarToast('Erro ao salvar lote.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function excluirLote(id) {
    try {
        const response = await apiFetch('lotes/excluir.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        const result = await apiJson(response);

        if (result.sucesso) {
            carregarLotes();
            mostrarToast(result.mensagem || 'Lote excluído com sucesso!', 'success');
        } else {
            mostrarToast(result.mensagem, 'danger');
        }
    } catch (error) {
        mostrarToast('Erro ao excluir lote.', 'danger');
    }
}

async function logout() {
    await window.logout();
}

function formatarDataLote(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return '-';
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function formatarDataInput(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}


