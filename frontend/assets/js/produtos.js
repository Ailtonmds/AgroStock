// Produtos JavaScript - CRUD completo

let buscaTimeout = null;
let categoriasCache = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarCategorias();
    carregarProdutos();

    document.getElementById('btnLogout').addEventListener('click', logout);
    document.getElementById('formProduto').addEventListener('submit', salvarProduto);
    document.getElementById('btnBuscar').addEventListener('click', carregarProdutos);
    document.getElementById('btnLimparBusca').addEventListener('click', () => {
        document.getElementById('buscaProduto').value = '';
        document.getElementById('filtroCategoria').value = '';
        document.getElementById('filtroStatus').value = '';
        carregarProdutos();
    });
    document.getElementById('filtroCategoria').addEventListener('change', carregarProdutos);
    document.getElementById('filtroStatus').addEventListener('change', carregarProdutos);
    document.getElementById('buscaProduto').addEventListener('input', debounceBusca);

    // Limpar formulário ao fechar modal
    document.getElementById('modalProduto').addEventListener('hidden.bs.modal', () => {
        document.getElementById('formProduto').reset();
        document.getElementById('produtoId').value = '';
        document.getElementById('modalProdutoLabel').textContent = 'Novo Produto';
        document.getElementById('btnSalvarProduto').innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar';
    });
});

async function carregarCategorias() {
    try {
        const response = await apiFetch('categorias/listar.php');
        const data = await apiJson(response);
        if (data.sucesso) {
            categoriasCache = data.dados;
            popularSelectCategorias();
        } else {
            mostrarToast('Erro ao carregar categorias.', 'danger');
        }
    } catch (e) {
        console.error('Erro ao carregar categorias:', e);
        mostrarToast('Erro ao carregar categorias.', 'danger');
    }
}

function popularSelectCategorias() {
    const selectCategoria = document.getElementById('categoria_id');
    const selectFiltro = document.getElementById('filtroCategoria');

    const options = categoriasCache.filter(c => c.ativo).map(c =>
        `<option value="${escapeHtml(c.id)}">${escapeHtml(c.nome)}</option>`
    ).join('');

    selectCategoria.innerHTML = '<option value="">Selecione</option>' + options;
    selectFiltro.innerHTML = '<option value="">Todas as categorias</option>' + options;
}

function debounceBusca() {
    clearTimeout(buscaTimeout);
    buscaTimeout = setTimeout(carregarProdutos, 300);
}

async function carregarProdutos() {
    const busca = document.getElementById('buscaProduto').value.trim();
    const categoria_id = document.getElementById('filtroCategoria').value;
    const ativo = document.getElementById('filtroStatus').value;

    let url = 'produtos/listar.php?';
    const params = new URLSearchParams();
    if (busca) params.append('busca', busca);
    if (categoria_id) params.append('categoria_id', categoria_id);
    if (ativo !== '') params.append('ativo', ativo);
    url += params.toString();

    const tbody = document.getElementById('tbodyProdutos');

    try {
        estadoCarregando(tbody, 8);

        const response = await apiFetch(url);
        const data = await apiJson(response);

        if (!data.sucesso || !data.dados || data.dados.length === 0) {
            estadoVazio(tbody, 8, 'Nenhum produto encontrado');
            return;
        }

        tbody.innerHTML = '';
        data.dados.forEach(p => {
            const tr = document.createElement('tr');

            const statusSpan = document.createElement('span');
            statusSpan.className = `badge ${p.ativo ? 'bg-success' : 'bg-secondary'}`;
            statusSpan.textContent = p.ativo ? 'Ativo' : 'Inativo';

            const nomeCelula = document.createElement('td');
            nomeCelula.innerHTML = `<strong>${escapeHtml(p.nome)}</strong><br><small class="text-secondary">${escapeHtml(p.descricao || '')}</small>`;

            tr.appendChild(nomeCelula);
            tr.appendChild(montarCelula(p.categoria_nome));
            tr.appendChild(montarCelula(p.unidade_medida));
            tr.appendChild(montarCelula(p.estoque_minimo));
            tr.appendChild(montarCelula(p.quantidade_total));
            tr.appendChild(montarCelula(p.localizacao || '-'));
            tr.appendChild(montarCelula('', 'text-center')).appendChild(statusSpan);

            // Ações
            const tdAcoes = document.createElement('td');
            tdAcoes.className = 'text-end';

            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn btn-sm btn-outline-primary me-1';
            btnEditar.title = 'Editar';
            btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
            btnEditar.addEventListener('click', () => editarProduto(Number(p.id)));

            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn btn-sm btn-outline-danger';
            btnExcluir.title = 'Excluir';
            btnExcluir.innerHTML = '<i class="bi bi-trash"></i>';
            btnExcluir.addEventListener('click', async () => {
                const confirmado = await confirmar(
                    'Excluir produto',
                    `Tem certeza que deseja excluir o produto "${escapeHtml(p.nome)}"?`
                );
                if (confirmado) await excluirProduto(Number(p.id));
            });

            tdAcoes.appendChild(btnEditar);
            tdAcoes.appendChild(btnExcluir);
            tr.appendChild(tdAcoes);

            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Erro ao carregar produtos:', e);
        estadoErro(tbody, 8, 'Erro ao carregar produtos. Verifique a conexão e tente novamente.', carregarProdutos);
    }
}

function abrirModalNovo() {
    document.getElementById('formProduto').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('modalProdutoLabel').textContent = 'Novo Produto';
    document.getElementById('btnSalvarProduto').innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar';
    document.getElementById('ativo').checked = true;
}

async function editarProduto(id) {
    try {
        const response = await apiFetch('produtos/listar.php');
        const data = await apiJson(response);

        if (!data.sucesso) {
            mostrarToast('Erro ao carregar dados do produto.', 'danger');
            return;
        }

        const produto = data.dados.find(p => Number(p.id) === Number(id));
        if (!produto) {
            mostrarToast('Produto não encontrado.', 'danger');
            return;
        }

        document.getElementById('produtoId').value = produto.id;
        document.getElementById('nome').value = produto.nome;
        document.getElementById('descricao').value = produto.descricao || '';
        document.getElementById('categoria_id').value = produto.categoria_id;
        document.getElementById('unidade_medida').value = produto.unidade_medida;
        document.getElementById('estoque_minimo').value = produto.estoque_minimo;
        document.getElementById('localizacao').value = produto.localizacao || '';
        document.getElementById('ativo').checked = produto.ativo === 1 || produto.ativo === true;

        document.getElementById('modalProdutoLabel').textContent = 'Editar Produto';
        document.getElementById('btnSalvarProduto').innerHTML = '<i class="bi bi-check-lg me-1"></i>Atualizar';

        const modal = new bootstrap.Modal(document.getElementById('modalProduto'));
        modal.show();
    } catch (e) {
        console.error('Erro ao carregar produto:', e);
        mostrarToast('Erro ao carregar produto.', 'danger');
    }
}

async function salvarProduto(e) {
    e.preventDefault();

    const id = document.getElementById('produtoId').value;
    const isEdit = id !== '';

    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());
    dados.ativo = dados.ativo === 'on' ? 1 : 0;
    dados.estoque_minimo = parseInt(dados.estoque_minimo) || 0;
    dados.categoria_id = parseInt(dados.categoria_id);

    const url = isEdit ? 'produtos/editar.php' : 'produtos/cadastrar.php';

    const btn = document.getElementById('btnSalvarProduto');
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
            bootstrap.Modal.getInstance(document.getElementById('modalProduto')).hide();
            carregarProdutos();
            mostrarToast(isEdit ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!', 'success');
        } else {
            mostrarToast(result.mensagem, 'danger');
        }
    } catch (error) {
        mostrarToast('Erro ao salvar produto.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function excluirProduto(id) {
    try {
        const response = await apiFetch('produtos/excluir.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        const result = await apiJson(response);

        if (result.sucesso) {
            carregarProdutos();
            mostrarToast(result.mensagem || 'Produto excluído com sucesso!', 'success');
        } else {
            mostrarToast(result.mensagem, 'danger');
        }
    } catch (error) {
        mostrarToast('Erro ao excluir produto.', 'danger');
    }
}

async function logout() {
    await window.logout();
}

function mostrarToast(mensagem, tipo = 'info') {
    window.mostrarToast(mensagem, tipo);
}
