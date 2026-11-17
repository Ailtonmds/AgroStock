// Dashboard AgroStock
let chartEstoqueCategoria = null;
let chartEntradasSaidas = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnLogout')?.addEventListener('click', logout);
    carregarDashboard();
});

async function carregarDashboard() {
    try {
        const response = await apiFetch('dashboard.php');
        const data = await apiJson(response);

        if (!response.ok || !data.sucesso || !data.dados) {
            throw new Error(data.mensagem || 'Não foi possível carregar os dados do painel.');
        }

        const d = data.dados;
        const estatisticas = d.estatisticas || {};
        const usuario = d.usuario || {};

        if (usuario.id) sessionStorage.setItem('usuario_id', String(usuario.id));
        if (usuario.nome) sessionStorage.setItem('usuario_nome', usuario.nome);

        definirTexto('statTotalProdutos', estatisticas.total_produtos);
        definirTexto('statTotalItens', estatisticas.total_itens_estoque);
        definirTexto('statEstoqueBaixo', estatisticas.estoque_baixo);
        definirTexto('statProximosValidade', estatisticas.proximos_validade);
        definirTexto('statVencidos', estatisticas.vencidos);
        definirTexto('usuarioNome', usuario.nome || sessionStorage.getItem('usuario_nome') || 'Usuário');

        atualizarTabelaMovimentacoes(Array.isArray(d.movimentacoes_recentes) ? d.movimentacoes_recentes : []);
        atualizarGraficos(d.graficos || {});
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        mostrarToast(error.message || 'Erro ao carregar dashboard. Verifique a conexão.', 'danger');
        exibirEstadoGrafico('chartEstoqueCategoria', 'Não foi possível carregar os dados do gráfico.');
        exibirEstadoGrafico('chartEntradasSaidas', 'Não foi possível carregar os dados do gráfico.');
    }
}

function definirTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor ?? 0;
}

function atualizarTabelaMovimentacoes(movimentacoes) {
    const tbody = document.querySelector('#tabelaMovimentacoes tbody');
    if (!tbody) return;

    if (!movimentacoes.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">Nenhuma movimentação registrada</td></tr>';
        return;
    }

    tbody.replaceChildren();
    movimentacoes.forEach((mov) => {
        const tr = document.createElement('tr');
        tr.appendChild(montarCelula(formatarData(mov.data_movimentacao)));
        tr.appendChild(montarCelula(mov.produto_nome));
        tr.appendChild(montarCelula(mov.numero_lote));

        const tipoCelula = document.createElement('td');
        tipoCelula.className = 'text-center';
        const tipoSpan = document.createElement('span');
        tipoSpan.className = `badge ${mov.tipo === 'entrada' ? 'bg-success' : 'bg-danger'}`;
        tipoSpan.textContent = mov.tipo === 'entrada' ? 'Entrada' : 'Saída';
        tipoCelula.appendChild(tipoSpan);
        tr.appendChild(tipoCelula);

        tr.appendChild(montarCelula(mov.quantidade));
        tr.appendChild(montarCelula(mov.usuario_nome));
        tbody.appendChild(tr);
    });
}

function atualizarGraficos(graficos) {
    if (typeof window.Chart !== 'function') {
        throw new Error('A biblioteca Chart.js não foi carregada. Verifique a conexão com a internet ou o CDN.');
    }

    const categorias = graficos.estoque_por_categoria || {};
    const categoriasLabels = Array.isArray(categorias.labels) ? categorias.labels : [];
    const categoriasValores = Array.isArray(categorias.data) ? categorias.data.map(Number) : [];

    const movimentacoes = graficos.entradas_saidas_30dias || {};
    const diasLabels = Array.isArray(movimentacoes.labels) ? movimentacoes.labels : [];
    const entradas = Array.isArray(movimentacoes.entradas) ? movimentacoes.entradas.map(Number) : [];
    const saidas = Array.isArray(movimentacoes.saidas) ? movimentacoes.saidas.map(Number) : [];

    criarGraficoCategoria(categoriasLabels, categoriasValores);
    criarGraficoMovimentacoes(diasLabels, entradas, saidas);
}

function prepararCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) throw new Error(`Canvas do gráfico "${id}" não encontrado.`);

    const container = canvas.parentElement;
    container.querySelector('.dashboard-chart-empty')?.remove();
    canvas.hidden = false;
    return canvas;
}

function exibirEstadoGrafico(id, mensagem) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const container = canvas.parentElement;
    canvas.hidden = true;
    let estado = container.querySelector('.dashboard-chart-empty');
    if (!estado) {
        estado = document.createElement('div');
        estado.className = 'dashboard-chart-empty';
        container.appendChild(estado);
    }
    estado.textContent = mensagem;
}

function criarGraficoCategoria(labels, valores) {
    const canvas = prepararCanvas('chartEstoqueCategoria');
    if (chartEstoqueCategoria) chartEstoqueCategoria.destroy();

    if (!labels.length || !valores.length || valores.every((valor) => !Number.isFinite(valor) || valor <= 0)) {
        exibirEstadoGrafico('chartEstoqueCategoria', 'Ainda não há itens em estoque para exibir por categoria.');
        chartEstoqueCategoria = null;
        return;
    }

    chartEstoqueCategoria = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: valores,
                backgroundColor: ['#246B3A', '#123D24', '#82D39C', '#C9A13B', '#4A9C66', '#6EC68A', '#A8E6B8', '#CFF2D9'],
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' }
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return ` ${context.label}: ${Number(context.parsed).toLocaleString('pt-BR')} itens`;
                        }
                    }
                }
            }
        }
    });
}

function criarGraficoMovimentacoes(labels, entradas, saidas) {
    const canvas = prepararCanvas('chartEntradasSaidas');
    if (chartEntradasSaidas) chartEntradasSaidas.destroy();

    if (!labels.length || (!entradas.some((valor) => valor > 0) && !saidas.some((valor) => valor > 0))) {
        exibirEstadoGrafico('chartEntradasSaidas', 'Nenhuma movimentação registrada nos últimos 30 dias.');
        chartEntradasSaidas = null;
        return;
    }

    chartEntradasSaidas = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Entradas',
                    data: entradas,
                    borderColor: '#246B3A',
                    backgroundColor: 'rgba(36, 107, 58, 0.12)',
                    pointBackgroundColor: '#246B3A',
                    pointRadius: 3,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Saídas',
                    data: saidas,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.10)',
                    pointBackgroundColor: '#dc3545',
                    pointRadius: 3,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' }
                }
            },
            scales: {
                x: {
                    ticks: { maxTicksLimit: 10, maxRotation: 0 }
                },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

function formatarData(dataString, comHora = true) {
    return window.formatarData(dataString, comHora);
}

async function logout() {
    await window.logout();
}

function mostrarToast(mensagem, tipo = 'info') {
    window.mostrarToast(mensagem, tipo);
}
