    </main>
</div>

<script>
    // Toggle da sidebar (desktop/mobile)
    const btnSidebarToggle = document.getElementById('btnSidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (btnSidebarToggle && sidebar) {
        btnSidebarToggle.addEventListener('click', () => {
            const isMobile = window.innerWidth <= 991;
            if (isMobile) {
                sidebar.classList.toggle('show');
                overlay.classList.toggle('show');
            } else {
                sidebar.classList.toggle('sidebar-collapsed');
            }
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }

    // Logout via sidebar
    const btnLogoutSidebar = document.getElementById('btnLogoutSidebar');
    if (btnLogoutSidebar) {
        btnLogoutSidebar.addEventListener('click', async () => {
            if (typeof window.logout === 'function') {
                await window.logout();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    // Atualiza o nome do usuário no topo (se disponível no sessionStorage)
    const nomeUsuarioLS = sessionStorage.getItem('usuario_nome');
    const elTopoNome = document.getElementById('topbarUsuarioNome');
    if (nomeUsuarioLS && elTopoNome) {
        elTopoNome.textContent = nomeUsuarioLS;
    }

    // Define o título da aba com base no título da página
    const tituloEl = document.getElementById('topbarPageTitle');
    if (tituloEl && document.title.includes('AgroStock')) {
        document.title = 'AgroStock — ' + tituloEl.textContent;
    }
</script>
