// Relatórios JavaScript

let chartRelEstoqueCategoria = null;
let chartRelStatusEstoque = null;
let produtosCache = [];

document.addEventListener('DOMContentLoaded', () => {
    // Definir datas padrão para movimentações (últimos 30 dias)
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);

    document.getElementById('rel_data_fim').value = formatarDataInput(hoje);
    document.getElementById('rel_data_inicio').value = formatarDataInput(trintaDiasAtras);

    carregarProdutosParaFiltros();
    carregarRelatorios();

    document.getElementById('btnLogout').addEventListener('click', logout);
    document.getElementById('btnAtualizarRelatorios').addEventListener('click', carregarRelatorios);
    document.getElementById('formFiltroMov').addEventListener('submit', (e) => {
        e.preventDefault();
        carregarRelMovimentacoes();
    });
    document.getElementById('btnAplicarFiltroValidade').addEventListener('click', carregarRelValidade);

    // Carregar relatório quando a aba for ativada
    document.querySelectorAll('#relatoriosTabs button[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (e) => {
            const target = e.target.getAttribute('data-bs-target');
            if (target === '#panel-estoque') carregarRelEstoque();
            else if (target === '#panel-movimentacoes') carregarRelMovimentacoes();
            else if (target === '#panel-validade') carregarRelValidade();
        });
    });
});

async function carregarProdutosParaFiltros() {
    try {
        const response = await apiFetch('produtos/listar.php?ativo=1');
        const data = await apiJson(response);
        if (data.sucesso) {
            produtosCache = data.dados;
            const options = produtosCache.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nome)}</option>`).join('');
            document.getElementById('rel_produto_id').innerHTML = '<option value="">Todos</option>' + options;
        }
    } catch (e) {
        console.error('Erro ao carregar produtos:', e);
        mostrarToast('Erro ao carregar produtos para filtro.', 'danger');
    }
}

async function carregarRelatorios() {
    await Promise.all([
        carregarRelEstoque(),
        carregarRelMovimentacoes(),
        carregarRelValidade()
    ]);
}

async function carregarRelEstoque() {
    try {
        const response = await apiFetch('relatorios/estoque.php');
        const data = await apiJson(response);

        if (data.sucesso) {
            atualizarTabelaRelEstoque(data.dados.produtos);
            atualizarGraficosRelEstoque(data.dados.resumo_por_categoria, data.dados.produtos);
        } else {
            mostrarToast('Erro ao carregar relatório de estoque.', 'danger');
        }
    } catch (e) {
        console.error('Erro ao carregar relatório de estoque:', e);
        mostrarToast('Erro ao carregar relatório de estoque.', 'danger');
    }
}

function atualizarTabelaRelEstoque(produtos) {
    const tbody = document.getElementById('tbodyRelEstoque');

    if (!produtos || produtos.length === 0) {
        estadoVazio(tbody, 7, 'Nenhum produto encontrado');
        return;
    }

    tbody.innerHTML = '';
    produtos.forEach(p => {
        let statusClass = 'bg-success';
        let statusText = 'OK';
        if (p.status_estoque === 'sem_estoque') {
            statusClass = 'bg-danger';
            statusText = 'Sem estoque';
        } else if (p.status_estoque === 'baixo') {
            statusClass = 'bg-warning text-dark';
            statusText = 'Baixo';
        }

        const tr = document.createElement('tr');

        tr.appendChild(montarCelula(`<strong>${escapeHtml(p.nome)}</strong>`));
        tr.appendChild(montarCelula(escapeHtml(p.categoria)));
        tr.appendChild(montarCelula(p.unidade_medida));
        tr.appendChild(montarCelula(p.estoque_minimo));
        tr.appendChild(montarCelula(p.quantidade_total));
        tr.appendChild(montarCelula(p.localizacao || '-'));

        const statusCelula = document.createElement('td');
        statusCelula.className = 'text-center';
        const badgeSpan = document.createElement('span');
        badgeSpan.className = `badge ${statusClass}`;
        badgeSpan.textContent = statusText;
        statusCelula.appendChild(badgeSpan);
        tr.appendChild(statusCelula);

        tbody.appendChild(tr);
    });
}

function atualizarGraficosRelEstoque(resumoCategoria, produtos) {
    // Gráfico 1: Estoque por categoria (Doughnut)
    const ctxCat = document.getElementById('chartRelEstoqueCategoria').getContext('2d');
    if (chartRelEstoqueCategoria) chartRelEstoqueCategoria.destroy();

    chartRelEstoqueCategoria = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: resumoCategoria.map(c => escapeHtml(c.categoria)),
            datasets: [{
                data: resumoCategoria.map(c => c.quantidade_total),
                backgroundColor: ['#1e7a46', '#14532d', '#82d39c', '#123d24', '#4a9c66', '#6ec68a'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, font: { size: 11 } } }
            }
        }
    });

    // Gráfico 2: Status do estoque (Bar)
    const ctxStatus = document.getElementById('chartRelStatusEstoque').getContext('2d');
    if (chartRelStatusEstoque) chartRelStatusEstoque.destroy();

    const semEstoque = produtos.filter(p => p.status_estoque === 'sem_estoque').length;
    const baixo = produtos.filter(p => p.status_estoque === 'baixo').length;
    const ok = produtos.filter(p => p.status_estoque === 'ok').length;

    chartRelStatusEstoque = new Chart(ctxStatus, {
        type: 'bar',
        data: {
            labels: ['Sem Estoque', 'Estoque Baixo', 'OK'],
            datasets: [{
                label: 'Quantidade de Produtos',
                data: [semEstoque, baixo, ok],
                backgroundColor: ['#dc3545', '#ffc107', '#1e7a46'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

async function carregarRelMovimentacoes() {
    const formData = new FormData(document.getElementById('formFiltroMov'));
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
        if (value) params.append(key, value);
    }

    try {
        const response = await apiFetch(`relatorios/movimentacoes.php?${params.toString()}`);
        const data = await apiJson(response);

        if (data.sucesso) {
            atualizarTabelaRelMovimentacoes(data.dados.movimentacoes);
            atualizarResumoMovimentacoes(data.dados.resumo);
        } else {
            mostrarToast('Erro ao carregar relatório de movimentações.', 'danger');
        }
    } catch (e) {
        console.error('Erro ao carregar relatório de movimentações:', e);
        mostrarToast('Erro ao carregar relatório de movimentações.', 'danger');
    }
}

function atualizarTabelaRelMovimentacoes(movimentacoes) {
    const tbody = document.getElementById('tbodyRelMovimentacoes');

    if (!movimentacoes || movimentacoes.length === 0) {
        estadoVazio(tbody, 7, 'Nenhuma movimentação encontrada');
        return;
    }

    tbody.innerHTML = '';
    movimentacoes.forEach(mov => {
        const tr = document.createElement('tr');

        tr.appendChild(montarCelula(formatarDataHora(mov.data_movimentacao)));
        tr.appendChild(montarCelula(`<strong>${escapeHtml(mov.produto_nome)}</strong>`));
        tr.appendChild(montarCelula(escapeHtml(mov.numero_lote)));

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
}

function atualizarResumoMovimentacoes(resumo) {
    document.getElementById('relTotalEntradas').textContent = resumo.entrada?.total_quantidade ?? 0;
    document.getElementById('relQtdEntradas').textContent = `${resumo.entrada?.total_movimentacoes ?? 0} movimentações`;
    document.getElementById('relTotalSaidas').textContent = resumo.saida?.total_quantidade ?? 0;
    document.getElementById('relQtdSaidas').textContent = `${resumo.saida?.total_movimentacoes ?? 0} movimentações`;
}

async function carregarRelValidade() {
    const status = document.getElementById('rel_validade_status').value;

    try {
        const response = await apiFetch(`relatorios/validade.php?status=${status}`);
        const data = await apiJson(response);

        if (data.sucesso) {
            atualizarTabelaRelValidade(data.dados.lotes);
            document.getElementById('relValVencidos').textContent = data.dados.estatisticas.vencidos ?? 0;
            document.getElementById('relValProximos').textContent = data.dados.estatisticas.proximos ?? 0;
            document.getElementById('relValOk').textContent = data.dados.estatisticas.ok ?? 0;
        } else {
            mostrarToast('Erro ao carregar relatório de validade.', 'danger');
        }
    } catch (e) {
        console.error('Erro ao carregar relatório de validade:', e);
        mostrarToast('Erro ao carregar relatório de validade.', 'danger');
    }
}

function atualizarTabelaRelValidade(lotes) {
    const tbody = document.getElementById('tbodyRelValidade');

    if (!lotes || lotes.length === 0) {
        estadoVazio(tbody, 8, 'Nenhum lote encontrado');
        return;
    }

    tbody.innerHTML = '';
    lotes.forEach(l => {
        let statusClass = 'bg-success';
        let statusText = 'Válido';
        if (l.status_validade === 'vencido') {
            statusClass = 'bg-danger';
            statusText = 'Vencido';
        } else if (l.status_validade === 'proximo') {
            statusClass = 'bg-warning text-dark';
            statusText = 'Próximo';
        }

        const tr = document.createElement('tr');
        if (l.status_validade === 'vencido') tr.className = 'table-danger';
        else if (l.status_validade === 'proximo') tr.className = 'table-warning';

        tr.appendChild(montarCelula(`<strong>${escapeHtml(l.produto_nome)}</strong>`));
        tr.appendChild(montarCelula(escapeHtml(l.categoria_nome)));
        tr.appendChild(montarCelula(escapeHtml(l.numero_lote)));
        tr.appendChild(montarCelula(formatarData(l.data_fabricacao)));
        tr.appendChild(montarCelula(formatarData(l.data_validade)));
        tr.appendChild(montarCelula(l.dias_restantes >= 0 ? l.dias_restantes : Math.abs(l.dias_restantes)));
        tr.appendChild(montarCelula(l.quantidade));

        const statusCelula = document.createElement('td');
        statusCelula.className = 'text-center';
        const badgeSpan = document.createElement('span');
        badgeSpan.className = `badge ${statusClass}`;
        badgeSpan.textContent = statusText;
        statusCelula.appendChild(badgeSpan);
        tr.appendChild(statusCelula);

        tbody.appendChild(tr);
    });
}

async function logout() {
    await window.logout();
}

function formatarData(dataString) {
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

function mostrarToast(mensagem, tipo = 'info') {
    window.mostrarToast(mensagem, tipo);
}
