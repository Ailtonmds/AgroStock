// sidebar.js - Inicialização compartilhada da sidebar (menu mobile) e topbar
// Incluir este script em todas as páginas internas do sistema AgroStock.

(function () {
    const nome = sessionStorage.getItem('usuario_nome') || 'Usuário';
    const tipo = sessionStorage.getItem('usuario_tipo') || 'Almoxarife';

    // Atualizar nome do usuário na topbar (se existir)
    const elTopbar = document.getElementById('usuarioNomeTopbar');
    const elMain = document.getElementById('usuarioNome');
    if (elTopbar) elTopbar.textContent = nome;
    if (elMain) elMain.textContent = nome;

    // Se não houver nav no HTML, injeta o nav.html compartilhado antes do main-content
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');

    function initSidebar() {
        const sidebarEl = document.getElementById('sidebar');
        const btnSidebarToggle = document.getElementById('btnSidebarToggle');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const btnLogoutSidebar = document.getElementById('btnLogoutSidebar');

        if (!sidebarEl || !btnSidebarToggle || !sidebarOverlay) return;

        function toggleSidebar() {
            sidebarEl.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        }

        btnSidebarToggle.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);

        // Fechar sidebar ao clicar em um item (mobile)
        document.querySelectorAll('.sidebar-item').forEach((item) => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 991) {
                    sidebarEl.classList.remove('show');
                    sidebarOverlay.classList.remove('show');
                }
            });
        });

        // Marcar item ativo pela URL atual
        const paginaAtual = location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.sidebar-item').forEach((item) => {
            const href = item.getAttribute('href');
            if (href && href === paginaAtual) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Atualizar usuário na nova nav (sidebar-user)
        const elUserNome = document.getElementById('sidebarUserNome');
        const elUserRole = document.getElementById('sidebarUserRole');
        const elUserAvatar = document.getElementById('sidebarUserAvatar');
        if (elUserNome) elUserNome.textContent = nome;
        if (elUserRole) elUserRole.textContent = tipo;
        if (elUserAvatar) elUserAvatar.textContent = (nome || 'U').charAt(0).toUpperCase();

        // Logout na sidebar
        if (btnLogoutSidebar) {
            btnLogoutSidebar.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof logout === 'function') logout();
            });
        }
    }

    if (sidebar) {
        // Nav já existe no HTML (ex: dashboard)
        initSidebar();
    } else if (mainContent) {
        // Carrega o nav.html e injeta antes do main-content
        fetch('../partials/nav.html')
            .then((resp) => {
                if (!resp.ok) throw new Error('nav.html não encontrado');
                return resp.text();
            })
            .then((html) => {
                mainContent.insertAdjacentHTML('beforebegin', html);
                initSidebar();
            })
            .catch((err) => {
                console.warn('sidebar.js: não foi possível carregar nav.html', err);
            });
    }
})();
