// utils.js - Utilitários compartilhados do frontend AgroStock
// Escapa HTML, exibe toasts, logout, formatação de dados e confirmações.

(function () {
    /* ============================================================
       ESCAPE HTML (previne XSS armazenado)
       ============================================================ */
    window.escapeHtml = function (texto) {
        if (texto == null) return '';
        const div = document.createElement('div');
        div.textContent = String(texto);
        return div.innerHTML;
    };

    /* ============================================================
       TOAST CONTAINER
       ============================================================ */
    window.criarToastContainer = function () {
        let container = document.getElementById('toastContainer');
        if (container) return container;
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1060';
        document.body.appendChild(container);
        return container;
    };

    window.mostrarToast = function (mensagem, tipo = 'info') {
        const container = criarToastContainer();
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        // Usa textContent para evitar XSS na mensagem do toast
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${escapeHtml(mensagem)}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
        `;
        container.appendChild(toastEl);
        const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
        bsToast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    };

    /* ============================================================
       LOGOUT
       ============================================================ */
    window.logout = async function () {
        try {
            await apiFetch('auth/logout.php', { method: 'POST' });
        } catch (e) {
            // ignora erro de rede: ainda assim redireciona
        } finally {
            window.location.href = 'index.html';
        }
    };

    /* ============================================================
       FORMATAÇÃO DE DATA
       ============================================================ */
    window.formatarData = function (dataString, comHora = true) {
        if (!dataString) return '-';
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return '-';
        const opts = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        };
        if (comHora) {
            opts.hour = '2-digit';
            opts.minute = '2-digit';
        }
        return data.toLocaleString('pt-BR', opts);
    };

    window.formatarDataCurta = function (dataString) {
        return window.formatarData(dataString, false);
    };

    /* ============================================================
       MODAL DE CONFIRMAÇÃO (substitui confirm() nativo)
       ============================================================ */
    window.confirmar = function (titulo, mensagem, btnConfirmarTexto = 'Confirmar', tipo = 'danger') {
        return new Promise((resolve) => {
            // Remove modal anterior se existir
            const antigo = document.getElementById('modalConfirmacao');
            if (antigo) antigo.remove();

            const html = `
                <div class="modal fade" id="modalConfirmacao" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content border-0">
                            <div class="modal-header bg-${tipo} text-white">
                                <h5 class="modal-title fw-bold">${escapeHtml(titulo)}</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body">
                                <p class="mb-0">${escapeHtml(mensagem)}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-${tipo === 'danger' ? 'danger' : tipo}" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-${tipo} fw-semibold" id="btnConfirmarModal">${escapeHtml(btnConfirmarTexto)}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);

            const modalEl = document.getElementById('modalConfirmacao');
            const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });

            document.getElementById('btnConfirmarModal').addEventListener('click', () => {
                modal.hide();
                resolve(true);
            });

            modalEl.addEventListener('hidden.bs.modal', () => {
                resolve(false);
                modalEl.remove();
            }, { once: true });

            modal.show();
        });
    };

    /* ============================================================
       ESTADO VAZIO (tabelas)
       ============================================================ */
    window.estadoVazio = function (tbody, colSpan, mensagem = 'Nenhum registro encontrado') {
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center text-secondary py-5">
            <i class="bi bi-inbox display-4 opacity-25 d-block mb-2"></i>
            ${escapeHtml(mensagem)}
        </td></tr>`;
    };

    /* ============================================================
       ESTADO DE ERRO (tabelas)
       ============================================================ */
    window.estadoErro = function (tbody, colSpan, mensagem, onRetry) {
        if (!tbody) return;
        const retryHtml = onRetry
            ? `<button class="btn btn-outline-primary btn-sm mt-3" id="btnTentarNovamente"><i class="bi bi-arrow-repeat me-1"></i>Tentar novamente</button>`
            : '';
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center text-danger py-5">
            <i class="bi bi-exclamation-triangle display-4 opacity-50 d-block mb-2"></i>
            <div>${escapeHtml(mensagem)}</div>
            ${retryHtml}
        </td></tr>`;
        if (onRetry) {
            document.getElementById('btnTentarNovamente')?.addEventListener('click', onRetry);
        }
    };

    /* ============================================================
       CARREGANDO (tabelas)
       ============================================================ */
    window.estadoCarregando = function (tbody, colSpan, mensagem = 'Carregando...') {
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center text-secondary py-4">
            <span class="spinner-border spinner-border-sm me-1"></span>${escapeHtml(mensagem)}
        </td></tr>`;
    };

    /* ============================================================
       BADGE DE STATUS (produto/lote/usuario)
       ============================================================ */
    window.badgeAtivo = function (ativo) {
        return ativo
            ? '<span class="badge bg-success">Ativo</span>'
            : '<span class="badge bg-secondary">Inativo</span>';
    };

    /* ============================================================
       BADGE DE VALIDADE (lote)
       ============================================================ */
    window.badgeValidade = function (status) {
        const map = {
            vencido: { classe: 'bg-danger', texto: 'Vencido' },
            proximo: { classe: 'bg-warning text-dark', texto: 'Próximo' },
            valido: { classe: 'bg-success', texto: 'Válido' },
        };
        const item = map[status] || map.valido;
        return `<span class="badge ${item.classe}">${item.texto}</span>`;
    };

    /* ============================================================
       BADGE DE TIPO DE MOVIMENTAÇÃO
       ============================================================ */
    window.badgeTipoMovimentacao = function (tipo) {
        return tipo === 'entrada'
            ? '<span class="badge bg-success">Entrada</span>'
            : '<span class="badge bg-danger">Saída</span>';
    };

    /* ============================================================
       MONTAR LINHA DE TABELA DE FORMA SEGURA (sem innerHTML nos dados)
       ============================================================ */
    window.montarCelula = function (valor, classe = '') {
        const td = document.createElement('td');
        if (classe) td.className = classe;
        td.textContent = valor;
        return td;
    };

    /* ============================================================
       BUSCAR DADOS COM TRATAMENTO DE ERRO PADRÃO
       ============================================================ */
    window.fetchJson = async function (path, options = {}) {
        const response = await apiFetch(path, options);
        const data = await apiJson(response);
        if (!response.ok || !data.sucesso) {
            const erro = new Error(data.mensagem || `Erro ${response.status}`);
            erro.response = response;
            erro.data = data;
            throw erro;
        }
        return data;
    };
})();
