<?php
require_once __DIR__ . '/../partials/page_auth.php';

$paginaAtual = 'dashboard';
$tituloPagina = 'Dashboard';
$subtituloPagina = 'Visão geral do almoxarifado';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard | AgroStock</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
<?php include __DIR__ . '/../partials/sidebar.php'; ?>

        <!-- Conteúdo da página -->
        <section class="page-header-flex">
            <div class="page-header-section">
                <span class="badge-pagina">Visão geral</span>
                <h1>Olá, <span id="usuarioNome">usuário</span></h1>
                <p class="text-secondary mb-0">Acompanhe rapidamente a situação do seu estoque.</p>
            </div>
            <div class="page-header-actions">
                <a href="produtos.php" class="btn btn-primary">
                    <i class="bi bi-plus-lg me-1"></i> Novo produto
                </a>
            </div>
        </section>

        <!-- Estatísticas -->
        <section class="row g-3 mb-4" aria-label="Resumo do estoque">
            <div class="col-sm-6 col-xl-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="stat-label">Produtos cadastrados</span>
                                <p class="stat-value" id="statTotalProdutos">0</p>
                            </div>
                            <span class="stat-icon" style="background: var(--verde-suave); color: var(--verde);"><i class="bi bi-box-seam"></i></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="stat-label">Itens em estoque</span>
                                <p class="stat-value" id="statTotalItens">0</p>
                            </div>
                            <span class="stat-icon" style="background: var(--verde-suave); color: var(--verde);"><i class="bi bi-clipboard-check"></i></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="stat-label">Estoque baixo</span>
                                <p class="stat-value text-danger" id="statEstoqueBaixo">0</p>
                            </div>
                            <span class="stat-icon" style="background: var(--vermelho-suave); color: var(--vermelho);"><i class="bi bi-exclamation-triangle"></i></span>
                        </div>
                        <span class="stat-trend stat-trend-neutral" id="trendEstoqueBaixo">Sem alteração</span>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="stat-label">Próximos do vencimento</span>
                                <p class="stat-value text-warning" id="statProximosValidade">0</p>
                            </div>
                            <span class="stat-icon" style="background: var(--amarelo-suave); color: #b38e30;"><i class="bi bi-calendar-x"></i></span>
                        </div>
                        <span class="stat-trend stat-trend-neutral" id="trendProximosValidade">Sem alteração</span>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="stat-label">Lotes vencidos</span>
                                <p class="stat-value text-danger" id="statVencidos">0</p>
                            </div>
                            <span class="stat-icon" style="background: var(--vermelho-suave); color: var(--vermelho);"><i class="bi bi-calendar-fill"></i></span>
                        </div>
                        <span class="stat-trend stat-trend-neutral" id="trendVencidos">Sem alteração</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="row g-4">
            <div class="col-lg-6">
                <div class="card h-100">
                    <div class="card-body p-4 p-md-5">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h2 class="h5 fw-bold mb-1">Estoque por Categoria</h2>
                                <p class="text-secondary small mb-0">Distribuição dos itens no estoque</p>
                            </div>
                            <span class="text-verde" style="font-size: 1.5rem;"><i class="bi bi-pie-chart"></i></span>
                        </div>
                        <canvas id="chartEstoqueCategoria" height="260"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card h-100">
                    <div class="card-body p-4 p-md-5">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h2 class="h5 fw-bold mb-1">Entradas vs Saídas (30 dias)</h2>
                                <p class="text-secondary small mb-0">Movimentações recentes</p>
                            </div>
                            <span class="text-verde" style="font-size: 1.5rem;"><i class="bi bi-graph-up"></i></span>
                        </div>
                        <canvas id="chartEntradasSaidas" height="260"></canvas>
                    </div>
                </div>
            </div>
        </section>

        <section class="row g-4">
            <div class="col-lg-8">
                <div class="card h-100" id="cardMovimentacoes">
                    <div class="card-body p-4 p-md-5">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h2 class="h5 fw-bold mb-1">Movimentações recentes</h2>
                                <p class="text-secondary small mb-0">As últimas entradas e saídas</p>
                            </div>
                            <a href="movimentacoes.php" class="btn btn-sm btn-outline-primary">Ver todas</a>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover mb-0" id="tabelaMovimentacoes">
                                <thead class="table-light">
                                    <tr>
                                        <th>Data</th>
                                        <th>Produto</th>
                                        <th>Lote</th>
                                        <th>Tipo</th>
                                        <th>Qtd</th>
                                        <th>Usuário</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="6" class="text-center text-secondary py-4">
                                            <span class="spinner-border spinner-border-sm me-1"></span> Carregando...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card h-100">
                    <div class="card-body p-4 p-md-5">
                        <h2 class="h5 fw-bold mb-3">Ações rápidas</h2>
                        <p class="text-secondary small mb-4">Acesse as principais tarefas do sistema.</p>
                        <div class="d-grid gap-3">
                            <a href="produtos.php" class="quick-link">
                                <span class="quick-link-icon"><i class="bi bi-plus-circle"></i></span>
                                <span class="flex-grow-1">Cadastrar produto</span>
                                <i class="bi bi-chevron-right quick-link-arrow"></i>
                            </a>
                            <a href="entrada.php" class="quick-link">
                                <span class="quick-link-icon"><i class="bi bi-arrow-down-circle"></i></span>
                                <span class="flex-grow-1">Registrar entrada</span>
                                <i class="bi bi-chevron-right quick-link-arrow"></i>
                            </a>
                            <a href="saida.php" class="quick-link">
                                <span class="quick-link-icon"><i class="bi bi-arrow-up-circle"></i></span>
                                <span class="flex-grow-1">Registrar saída</span>
                                <i class="bi bi-chevron-right quick-link-arrow"></i>
                            </a>
                            <a href="alertas.php" class="quick-link">
                                <span class="quick-link-icon"><i class="bi bi-bell"></i></span>
                                <span class="flex-grow-1">Ver alertas</span>
                                <i class="bi bi-chevron-right quick-link-arrow"></i>
                            </a>
                            <a href="relatorios.php" class="quick-link">
                                <span class="quick-link-icon"><i class="bi bi-file-earmark-bar-graph"></i></span>
                                <span class="flex-grow-1">Gerar relatórios</span>
                                <i class="bi bi-chevron-right quick-link-arrow"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>

<?php include __DIR__ . '/../partials/footer.php'; ?>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../assets/js/api.js"></script>
    <script src="../assets/js/utils.js"></script>
    <script src="../assets/js/dashboard.js"></script>
</body>
</html>
