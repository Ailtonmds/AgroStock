// Alertas JavaScript

document.addEventListener('DOMContentLoaded', () => {
    carregarAlertas();

    document.getElementById('btnLogout').addEventListener('click', logout);
    document.getElementById('btnAtualizarAlertas').addEventListener('click', carregarAlertas);
});

async function carregarAlertas() {
    const btn = document.getElementById('btnAtualizarAlertas');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Atualizando...';

    try {
        // Estoque baixo
        const responseBaixo = await apiFetch('alertas/estoque_baixo.php');
        const dataBaixo = await apiJson(responseBaixo);

        if (dataBaixo.sucesso) {
            atualizarTabelaEstoqueBaixo(dataBaixo.dados);
            document.getElementById('totalEstoqueBaixo').textContent = dataBaixo.total ?? 0;
        } else {
            mostrarToast('Erro ao carregar estoque baixo.', 'danger');
        }

        // Validade (próximos e vencidos)
        const responseValidade = await apiFetch('alertas/validade.php');
        const dataValidade = await apiJson(responseValidade);

        if (dataValidade.sucesso) {
            atualizarTabelaProximos(dataValidade.dados.proximos_vencimento);
            atualizarTabelaVencidos(dataValidade.dados.vencidos);
            document.getElementById('totalProximosValidade').textContent = dataValidade.total_proximos ?? 0;
            document.getElementById('totalVencidos').textContent = dataValidade.total_vencidos ?? 0;
        } else {
            mostrarToast('Erro ao carregar alertas de validade.', 'danger');
        }

        const total = (dataBaixo.total || 0) + (dataValidade.total_proximos || 0) + (dataValidade.total_vencidos || 0);
        document.getElementById('totalAlertas').textContent = total;

    } catch (e) {
        console.error('Erro ao carregar alertas:', e);
        mostrarToast('Erro ao carregar alertas. Verifique a conexão.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function atualizarTabelaEstoqueBaixo(produtos) {
    const tbody = document.getElementById('tbodyEstoqueBaixo');

    if (!produtos || produtos.length === 0) {
        estadoVazio(tbody, 6, 'Nenhum produto com estoque baixo');
        return;
    }

    tbody.innerHTML = '';
    produtos.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'table-warning';

        tr.appendChild(montarCelula(`<strong>${escapeHtml(p.nome)}</strong>`));
        tr.appendChild(montarCelula(escapeHtml(p.categoria_nome)));

        const qtdCelula = document.createElement('td');
        qtdCelula.className = 'text-center fw-bold text-danger';
        qtdCelula.textContent = p.quantidade_total;
        tr.appendChild(qtdCelula);

        tr.appendChild(montarCelula(p.estoque_minimo));
        tr.appendChild(montarCelula(p.unidade_medida));
        tr.appendChild(montarCelula(p.localizacao || '-'));

        tbody.appendChild(tr);
    });
}

function atualizarTabelaProximos(lotes) {
    const tbody = document.getElementById('tbodyProximosValidade');

    if (!lotes || lotes.length === 0) {
        estadoVazio(tbody, 6, 'Nenhum lote próximo do vencimento');
        return;
    }

    tbody.innerHTML = '';
    lotes.forEach(l => {
        const tr = document.createElement('tr');
        tr.className = 'table-warning';

        tr.appendChild(montarCelula(`<strong>${escapeHtml(l.produto_nome)}</strong>`));
        tr.appendChild(montarCelula(escapeHtml(l.categoria_nome)));
        tr.appendChild(montarCelula(escapeHtml(l.numero_lote)));
        tr.appendChild(montarCelula(formatarData(l.data_validade)));

        const diasCelula = document.createElement('td');
        diasCelula.className = 'text-center';
        const diasBadge = document.createElement('span');
        diasBadge.className = 'badge bg-warning text-dark';
        diasBadge.textContent = `${l.dias_restantes} dias`;
        diasCelula.appendChild(diasBadge);
        tr.appendChild(diasCelula);

        tr.appendChild(montarCelula(l.quantidade));

        tbody.appendChild(tr);
    });
}

function atualizarTabelaVencidos(lotes) {
    const tbody = document.getElementById('tbodyVencidos');

    if (!lotes || lotes.length === 0) {
        estadoVazio(tbody, 6, 'Nenhum lote vencido');
        return;
    }

    tbody.innerHTML = '';
    lotes.forEach(l => {
        const tr = document.createElement('tr');
        tr.className = 'table-danger';

        tr.appendChild(montarCelula(`<strong>${escapeHtml(l.produto_nome)}</strong>`));
        tr.appendChild(montarCelula(escapeHtml(l.categoria_nome)));
        tr.appendChild(montarCelula(escapeHtml(l.numero_lote)));
        tr.appendChild(montarCelula(formatarData(l.data_validade)));

        const diasCelula = document.createElement('td');
        diasCelula.className = 'text-center';
        const diasBadge = document.createElement('span');
        diasBadge.className = 'badge bg-danger';
        diasBadge.textContent = `${Math.abs(l.dias_restantes)} dias`;
        diasCelula.appendChild(diasBadge);
        tr.appendChild(diasCelula);

        tr.appendChild(montarCelula(l.quantidade));

        tbody.appendChild(tr);
    });
}

async function logout() {
    await window.logout();
}

function formatarData(dataString) {
    return window.formatarDataCurta(dataString);
}

function mostrarToast(mensagem, tipo = 'info') {
    window.mostrarToast(mensagem, tipo);
}
