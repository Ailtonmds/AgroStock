<!-- Sidebar — Estilo Tabler (AgroStock) -->
<nav class="sidebar" id="sidebar">
    <div class="sidebar-brand">
        <img src="../assets/img/logo.png" alt="Logo AgroStock">
        <span>AgroStock</span>
    </div>

    <div class="sidebar-nav">
        <div class="sidebar-section">
            <div class="sidebar-section-title">Navegação</div>
            <a class="sidebar-item <?= $paginaAtual === 'dashboard' ? 'active' : '' ?>" href="dashboard.html">
                <i class="bi bi-grid"></i><span class="sidebar-label">Dashboard</span>
            </a>
            <a class="sidebar-item <?= $paginaAtual === 'produtos' ? 'active' : '' ?>" href="produtos.html">
                <i class="bi bi-box-seam"></i><span class="sidebar-label">Produtos</span>
            </a>
            <a class="sidebar-item <?= $paginaAtual === 'categorias' ? 'active' : '' ?>" href="categorias.html">
                <i class="bi bi-tags"></i><span class="sidebar-label">Categorias</span>
            </a>
            <a class="sidebar-item <?= $paginaAtual === 'lotes' ? 'active' : '' ?>" href="lotes.html">
                <i class="bi bi-upc-scan"></i><span class="sidebar-label">Lotes</span>
            </a>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-section-title">Estoque</div>
            <a class="sidebar-item <?= $paginaAtual === 'estoque' ? 'active' : '' ?>" href="estoque.html">
                <i class="bi bi-arrow-left-right"></i><span class="sidebar-label">Entrada / Saída</span>
            </a>
            <a class="sidebar-item <?= $paginaAtual === 'movimentacoes' ? 'active' : '' ?>" href="movimentacoes.html">
                <i class="bi bi-clock-history"></i><span class="sidebar-label">Movimentações</span>
            </a>
            <a class="sidebar-item <?= $paginaAtual === 'alertas' ? 'active' : '' ?>" href="alertas.html">
                <i class="bi bi-bell"></i><span class="sidebar-label">Alertas</span>
            </a>
            <a class="sidebar-item <?= $paginaAtual === 'relatorios' ? 'active' : '' ?>" href="relatorios.html">
                <i class="bi bi-file-earmark-bar-graph"></i><span class="sidebar-label">Relatórios</span>
            </a>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-section-title">Sistema</div>
            <a class="sidebar-item <?= $paginaAtual === 'usuarios' ? 'active' : '' ?>" href="usuarios.html">
                <i class="bi bi-people"></i><span class="sidebar-label">Usuários</span>
            </a>
        </div>
    </div>

    <div class="sidebar-footer">
        <div class="sidebar-footer-item" id="btnLogoutSidebar">
            <i class="bi bi-box-arrow-right"></i><span class="sidebar-label">Sair</span>
        </div>
    </div>
</nav>

<!-- Overlay da sidebar em dispositivos móveis -->
<div class="sidebar-overlay" id="sidebarOverlay" data-bs-dismiss="offcanvas"></div>

<header class="topbar">
    <div class="topbar-left">
        <button class="btn-sidebar-toggle" id="btnSidebarToggle" aria-label="Alternar menu">
            <i class="bi bi-list"></i>
        </button>
        <div class="page-header-info">
            <div class="page-title" id="topbarPageTitle"><?= htmlspecialchars($tituloPagina ?? 'AgroStock') ?></div>
            <div class="page-subtitle" id="topbarPageSubtitle"><?= htmlspecialchars($subtituloPagina ?? '') ?></div>
        </div>
    </div>

    <div class="topbar-right">
        <div class="user-badge">
            <i class="bi bi-person-circle"></i>
            <span id="topbarUsuarioNome"><?= htmlspecialchars($_SESSION['nome'] ?? $_SESSION['usuario'] ?? 'Usuário') ?></span>
        </div>
    </div>
</header>

<div class="main-content">
    <main class="container">
