// etiquetas.js - Lógica da página de Etiquetas de Código de Barras
// Dados dos lotes, geração e impressão de etiquetas.

(function () {
    // Dados dos lotes para etiquetas
    let lotesEtiqueta = [];

    // Formato atual da etiqueta
    let formatoAtual = '50x30';

    const formatoSelect = document.getElementById('formatoEtiqueta');
    const tbody = document.getElementById('tbodyEtiquetas');
    const container = document.getElementById('containerEtiquetas');
    const areaEtiquetas = document.getElementById('areaEtiquetas');

    async function carregarLotes() {
        try {
            const response = await apiFetch('lotes/listar.php');
            const data = await apiJson(response);

            if (!data.sucesso || !data.dados || data.dados.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-5">Nenhum lote cadastrado.</td></tr>';
                return;
            }

            lotesEtiqueta = data.dados;
            renderTabela();
        } catch (e) {
            console.error('Erro ao carregar lotes para etiquetas:', e);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-5">Erro ao carregar lotes.</td></tr>';
        }
    }

    function renderTabela() {
        tbody.innerHTML = '';
        lotesEtiqueta.forEach((l) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(l.produto_nome)}</strong></td>
                <td>${escapeHtml(l.numero_lote)}</td>
                <td>${escapeHtml(l.codigo_barras_interno || '-')}</td>
                <td>${l.data_validade ? formatarDataCurta(l.data_validade) : '-'}</td>
                <td>${l.quantidade}</td>
                <td class="text-end">
                    ${l.codigo_barras_interno
                        ? `<button class="btn btn-outline-success btn-sm" onclick="gerarEtiqueta(${l.id})" title="Gerar etiqueta"><i class="bi bi-barcode"></i></button>`
                        : `<span class="text-muted small" title="Sem código interno"><i class="bi bi-barcode"></i>–</span>`}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.gerarEtiqueta = async function (loteId) {
        const lote = lotesEtiqueta.find((l) => l.id === loteId);
        if (!lote) return;

        // Monta o container de etiquetas com esta etiqueta
        container.innerHTML = '';
        container.appendChild(montarEtiqueta(lote, formatoAtual));
        areaEtiquetas.style.display = '';
        areaEtiquetas.scrollIntoView({ behavior: 'smooth' });
    };

    document.getElementById('btnVisualizarTodos').addEventListener('click', () => {
        container.innerHTML = '';
        const validos = lotesEtiqueta.filter((l) => l.codigo_barras_interno);
        if (validos.length === 0) {
            mostrarToast('Nenhum lote possui código de barras interno.', 'warning');
            return;
        }
        validos.forEach((l) => container.appendChild(montarEtiqueta(l, formatoAtual)));
        areaEtiquetas.style.display = '';
    });

    formatoSelect.addEventListener('change', () => {
        formatoAtual = formatoSelect.value;
        // Re-renderiza se houver etiquetas visíveis
        if (areaEtiquetas.style.display !== 'none' && container.children.length > 0) {
            const ids = Array.from(container.querySelectorAll('.etiqueta')).map(
                (el) => el.dataset.loteId
            );
            container.innerHTML = '';
            lotesEtiqueta
                .filter((l) => ids.includes(String(l.id)))
                .forEach((l) => {
                    container.appendChild(montarEtiqueta(l, formatoAtual));
                });
        }
    });

    function montarEtiqueta(lote, formato) {
        const div = document.createElement('div');
        div.className = `etiqueta ${formato === '60x40' ? 'etiqueta-60x40' : 'etiqueta-50x30'}`;
        div.dataset.loteId = lote.id;

        const produto = escapeHtml(lote.produto_nome);
        const numeroLote = escapeHtml(lote.numero_lote);
        const codigoInterno = escapeHtml(lote.codigo_barras_interno);
        const validade = lote.data_validade ? formatarDataCurta(lote.data_validade) : '-';
        const quantidade = lote.quantidade;
        const svgUrl = `../../backend/lotes/codigo_barras.php?id=${lote.id}`;

        div.innerHTML = `
            <div class="agrostock">AGROSTOCK</div>
            <div class="produto-nome">${produto}</div>
            <div class="dados-lote">
                <strong>Lote:</strong> ${numeroLote} &nbsp;|&nbsp;
                <strong>Validade:</strong> ${validade} &nbsp;|&nbsp;
                <strong>Qtd:</strong> ${quantidade}
            </div>
            <img class="codigo-barras-img" src="${svgUrl}" alt="Código de barras ${codigoInterno}">
            <div class="codigo-textual">${codigoInterno}</div>
        `;
        return div;
    }

    document.getElementById('btnFecharEtiquetas').addEventListener('click', () => {
        areaEtiquetas.style.display = 'none';
        container.innerHTML = '';
    });

    function imprimir() {
        window.print();
    }

    document.getElementById('btnImprimir').addEventListener('click', imprimir);
    document.getElementById('btnImprimirEtiquetas').addEventListener('click', imprimir);

    // Logout na sidebar (específico desta página, caso o sidebar.js não esteja carregado)
    const btnLogoutSidebar = document.getElementById('btnLogoutSidebar');
    if (btnLogoutSidebar) {
        btnLogoutSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    carregarLotes();

    async function logout() {
        await window.logout();
    }
})();
