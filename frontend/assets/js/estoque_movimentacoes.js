// Movimentações JavaScript - Listagem com filtros e paginação

let paginaAtual = 1;
const limitePorPagina = 20;
let produtosCache = [];

document.addEventListener('DOMContentLoaded', () => {
    // Definir datas padrão (últimos 30 dias)
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);

    document.getElementById('data_fim').value = formatarDataInput(hoje);
    document.getElementById('data_inicio').value = formatarDataInput(trintaDiasAtras);

    carregarProdutosParaFiltro();
    carregarMovimentacoes();

    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('formFiltros').addEventListener('submit', (e) => {
        e.preventDefault();
        paginaAtual = 1;
        carregarMovimentacoes();
    });
    document.getElementById('btnLimparFiltros').addEventListener('click', limparFiltros);
});

async function carregarProdutosParaFiltro() {
    try {
        const response = await apiFetch('produtos/listar.php?ativo=1');
        const data = await apiJson(response);
        if (data.sucesso) {
            produtosCache = data.dados;
            const select = document.getElementById('produto_id');
            select.innerHTML = '<option value="">Todos</option>' +
                produtosCache.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nome)}</option>`).join('');
        }
    } catch (e) {
        console.error('Erro ao carregar produtos:', e);
        mostrarToast('Erro ao carregar produtos para filtro.', 'danger');
    }
}

async function carregarMovimentacoes() {
    const formData = new FormData(document.getElementById('formFiltros'));
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
        if (value) params.append(key, value);
    }
    params.append('pagina', paginaAtual);
    params.append('limite', limitePorPagina);

    const tbody = document.getElementById('tbodyMovimentacoes');
    const paginacao = document.getElementById('paginacao');
    const paginacaoInfo = document.getElementById('paginacaoInfo');

    try {
        estadoCarregando(tbody, 8);

        const response = await apiFetch(`estoque/movimentacoes.php?${params.toString()}`);
        const data = await apiJson(response);

        if (response._sessaoExpirada) {
            mostrarToast(data.mensagem || 'Sessão expirada. Faça login novamente.', 'warning');
            estadoErro(tbody, 8, data.mensagem || 'Sessão expirada. Faça login novamente.', carregarMovimentacoes);
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
            return;
        }

        if (!data.sucesso) {
            estadoErro(tbody, 8, data.mensagem || 'Erro ao carregar movimentações.', carregarMovimentacoes);
            paginacao.innerHTML = '';
            paginacaoInfo.textContent = '';
            return;
        }

        const dados = Array.isArray(data.dados) ? data.dados : [];

        if (dados.length === 0) {
            estadoVazio(tbody, 8, 'Nenhuma movimentação encontrada');
            paginacao.innerHTML = '';
            paginacaoInfo.textContent = '';
            return;
        }

        tbody.innerHTML = '';
        dados.forEach(mov => {
            const tr = document.createElement('tr');

            tr.appendChild(montarCelula(formatarDataHora(mov.data_movimentacao)));
            tr.appendChild(montarCelula(escapeHtml(mov.produto_nome)));
            tr.appendChild(montarCelula(escapeHtml(mov.numero_lote)));
            tr.appendChild(montarCelula(formatarDataMov(mov.data_validade)));

            const tipoCelula = document.createElement('td');
            tipoCelula.className = 'text-center';
            const tipoSpan = document.createElement('span');
            tipoSpan.className = `badge ${mov.tipo === 'entrada' ? 'bg-success' : 'bg-danger'}`;
            tipoSpan.textContent = mov.tipo === 'entrada' ? 'Entrada' : 'Saída';
            tipoCelula.appendChild(tipoSpan);
            tr.appendChild(tipoCelula);

            tr.appendChild(montarCelula(mov.quantidade));
            tr.appendChild(montarCelula(escapeHtml(mov.usuario_nome)));
            tr.appendChild(montarCelula(mov.observacao || '-'));

            tbody.appendChild(tr);
        });

        // Paginação
        const { pagina, total_paginas, total } = data.paginacao;
        paginaAtual = pagina;

        if (total_paginas > 1) {
            let pagHtml = '';

            // Anterior
            pagHtml += `<li class="page-item ${pagina === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-pagina="${pagina - 1}" aria-label="Anterior"><i class="bi bi-chevron-left"></i></a>
            </li>`;

            // Páginas
            let inicio = Math.max(1, pagina - 2);
            let fim = Math.min(total_paginas, inicio + 4);
            if (fim - inicio < 4) {
                inicio = Math.max(1, fim - 4);
            }

            for (let i = inicio; i <= fim; i++) {
                pagHtml += `<li class="page-item ${i === pagina ? 'active' : ''}">
                    <a class="page-link" href="#" data-pagina="${i}">${i}</a>
                </li>`;
            }

            // Próximo
            pagHtml += `<li class="page-item ${pagina === total_paginas ? 'disabled' : ''}">
                <a class="page-link" href="#" data-pagina="${pagina + 1}" aria-label="Próximo"><i class="bi bi-chevron-right"></i></a>
            </li>`;

            paginacao.innerHTML = pagHtml;

            // Event listeners da paginação (delegação)
            paginacao.querySelectorAll('a[data-pagina]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    paginaAtual = Number(link.getAttribute('data-pagina'));
                    carregarMovimentacoes();
                });
            });
        } else {
            paginacao.innerHTML = '';
        }

        const inicioRange = (pagina - 1) * limitePorPagina + 1;
        const fimRange = Math.min(pagina * limitePorPagina, total);
        paginacaoInfo.textContent = `Mostrando ${inicioRange} a ${fimRange} de ${total} registros`;

    } catch (e) {
        console.error('Erro ao carregar movimentações:', e);
        estadoErro(tbody, 8, 'Erro ao carregar movimentações. Verifique a conexão e tente novamente.', carregarMovimentacoes);
    }
}

function limparFiltros() {
    document.getElementById('formFiltros').reset();
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    document.getElementById('data_fim').value = formatarDataInput(hoje);
    document.getElementById('data_inicio').value = formatarDataInput(trintaDiasAtras);
    paginaAtual = 1;
    carregarMovimentacoes();
}

async function logout() {
    await window.logout();
}

function formatarDataMov(dataString) {
    return window.formatarDataCurta(dataString);
}

function formatarDataInput(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function formatarDataHora(dataString) {
    return window.formatarData(dataString, true);
}


