// Dashboard JavaScript - Carrega dados da API e atualiza a interface

let chartEstoqueCategoria = null;
let chartEntradasSaidas = null;

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDashboard();

    document.getElementById('btnLogout').addEventListener('click', logout);
});

async function carregarDashboard() {
    try {
        const response = await apiFetch('dashboard.php');
        const data = await apiJson(response);

        if (!data.sucesso) {
            mostrarToast(data.mensagem || 'Erro ao carregar dashboard.', 'danger');
            return;
        }

        const d = data.dados;
        const usuario = d.usuario || {};
        if (usuario.id) sessionStorage.setItem('usuario_id', String(usuario.id));
        if (usuario.nome) sessionStorage.setItem('usuario_nome', usuario.nome);
        if (usuario.nivel_acesso) sessionStorage.setItem('nivel_acesso', usuario.nivel_acesso);

        // Atualizar estatísticas
        document.getElementById('statTotalProdutos').textContent = d.estatisticas.total_produtos ?? 0;
        document.getElementById('statTotalItens').textContent = d.estatisticas.total_itens_estoque ?? 0;
        document.getElementById('statEstoqueBaixo').textContent = d.estatisticas.estoque_baixo ?? 0;
        document.getElementById('statProximosValidade').textContent = d.estatisticas.proximos_validade ?? 0;
        document.getElementById('statVencidos').textContent = d.estatisticas.vencidos ?? 0;

        // Atualizar nome do usuário
        const usuarioNome = sessionStorage.getItem('usuario_nome') || 'Usuário';
        document.getElementById('usuarioNome').textContent = escapeHtml(usuarioNome);

        // Atualizar movimentações recentes
        atualizarTabelaMovimentacoes(d.movimentacoes_recentes);

        // Atualizar gráficos
        atualizarGraficos(d.graficos);

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        mostrarToast('Erro ao carregar dashboard. Verifique a conexão.', 'danger');
    }
}

function atualizarTabelaMovimentacoes(movimentacoes) {
    const tbody = document.querySelector('#tabelaMovimentacoes tbody');

    if (!movimentacoes || movimentacoes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">Nenhuma movimentação registrada</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    movimentacoes.forEach(mov => {
        const tr = document.createElement('tr');

        tr.appendChild(montarCelula(formatarData(mov.data_movimentacao)));
        tr.appendChild(montarCelula(escapeHtml(mov.produto_nome)));
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

        tbody.appendChild(tr);
    });
}

function atualizarGraficos(graficos) {
    // Gráfico de estoque por categoria (Doughnut)
    const ctxCat = document.getElementById('chartEstoqueCategoria').getContext('2d');
    if (chartEstoqueCategoria) chartEstoqueCategoria.destroy();

    chartEstoqueCategoria = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: graficos.estoque_por_categoria.labels,
            datasets: [{
                data: graficos.estoque_por_categoria.data,
                backgroundColor: [
                    '#1e7a46', '#14532d', '#82d39c', '#123d24',
                    '#4a9c66', '#6ec68a', '#a8e6b8', '#cff2d9'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 15, font: { size: 12 } }
                }
            }
        }
    });

    // Gráfico de entradas vs saídas (Line)
    const ctxMov = document.getElementById('chartEntradasSaidas').getContext('2d');
    if (chartEntradasSaidas) chartEntradasSaidas.destroy();

    chartEntradasSaidas = new Chart(ctxMov, {
        type: 'line',
        data: {
            labels: graficos.entradas_saidas_30dias.labels,
            datasets: [
                {
                    label: 'Entradas',
                    data: graficos.entradas_saidas_30dias.entradas,
                    borderColor: '#1e7a46',
                    backgroundColor: 'rgba(30, 122, 70, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Saídas',
                    data: graficos.entradas_saidas_30dias.saidas,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 } } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
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
