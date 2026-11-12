<?php
require_once __DIR__ . '/../partials/page_auth.php';

$paginaAtual = 'alertas';
$tituloPagina = 'Alertas';
$subtituloPagina = 'Monitore estoque baixo e produtos próximos do vencimento';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alertas | AgroStock</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<?php include __DIR__ . '/../partials/sidebar.php'; ?>

        <section class="page-header-flex">
            <div class="page-header-section">
                <span class="badge-pagina">Estoque</span>
                <h1>Alertas do Sistema</h1>
                <p class="text-secondary mb-0">Monitore estoque baixo e produtos próximos do vencimento</p>
            </div>
            <div class="page-header-actions">
                <button class="btn btn-outline-primary" id="btnAtualizarAlertas"><i class="bi bi-arrow-clockwise me-1"></i> Atualizar</button>
            </div>
        </section>

        <!-- Cards de resumo -->
        <div class="row g-3 mb-4">
            <div class="col-sm-6 col-xl-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="stat-label">Estoque Baixo</span>
                                <p class="stat-value text-danger" id="totalEstoqueBaixo">0</p>
                            </div>
                            <span class="stat-icon" style="background: var(--vermelho-suave); color: var(--vermelho);"><i class="bi bi-exclamation-triangle"></i></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="stat-label">Próximos do Vencimento</span>
                                <p class="stat-value text-warning" id="totalProximosValidade">0</p>
                            </div>
                            <span class="stat-icon" style="background: var(--amarelo-suave); color: #b38e30;"><i class="bi bi-clock-history"></i></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="stat-label">Vencidos</span>
                                <p class="stat-value text-danger" id="totalVencidos">0</p>
                            </div>
                            <span class="stat-icon" style="background: var(--vermelho-suave); color: var(--vermelho);"><i class="bi bi-calendar-x"></i></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="stat-label">Total de Alertas</span>
                                <p class="stat-value text-info" id="totalAlertas">0</p>
                            </div>
                            <span class="stat-icon" style="background: var(--azul-suave); color: var(--azul);"><i class="bi bi-bell"></i></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Abas para separar os tipos de alerta -->
        <ul class="nav nav-tabs mb-4" id="alertasTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="tab-estoque-baixo" data-bs-toggle="tab" data-bs-target="#panel-estoque-baixo" type="button" role="tab">
                    <i class="bi bi-exclamation-triangle me-1"></i> Estoque Baixo
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="tab-proximos" data-bs-toggle="tab" data-bs-target="#panel-proximos" type="button" role="tab">
                    <i class="bi bi-clock-history me-1"></i> Próximos do Vencimento
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="tab-vencidos" data-bs-toggle="tab" data-bs-target="#panel-vencidos" type="button" role="tab">
                    <i class="bi bi-calendar-x me-1"></i> Vencidos
                </button>
            </li>
        </ul>

        <div class="tab-content" id="alertasTabContent">
            <!-- Estoque Baixo -->
            <div class="tab-pane fade show active" id="panel-estoque-baixo" role="tabpanel">
                <div class="card">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0" id="tabelaEstoqueBaixo">
                                <thead class="table-light">
                                    <tr>
                                        <th style="width: 24%;">Produto</th>
                                        <th style="width: 18%;">Categoria</th>
                                        <th style="width: 14%;">Qtd. Atual</th>
                                        <th style="width: 14%;">Estoque Mín.</th>
                                        <th style="width: 14%;">Unidade</th>
                                        <th style="width: 20%;">Localização</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyEstoqueBaixo">
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

            <!-- Próximos do Vencimento -->
            <div class="tab-pane fade" id="panel-proximos" role="tabpanel">
                <div class="card">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0" id="tabelaProximosValidade">
                                <thead class="table-light">
                                    <tr>
                                        <th style="width: 20%;">Produto</th>
                                        <th style="width: 16%;">Categoria</th>
                                        <th style="width: 16%;">Lote</th>
                                        <th style="width: 14%;">Validade</th>
                                        <th style="width: 14%;">Dias Restantes</th>
                                        <th style="width: 12%;">Qtd.</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyProximosValidade">
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

            <!-- Vencidos -->
            <div class="tab-pane fade" id="panel-vencidos" role="tabpanel">
                <div class="card">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0" id="tabelaVencidos">
                                <thead class="table-light">
                                    <tr>
                                        <th style="width: 20%;">Produto</th>
                                        <th style="width: 16%;">Categoria</th>
                                        <th style="width: 16%;">Lote</th>
                                        <th style="width: 14%;">Validade</th>
                                        <th style="width: 14%;">Dias Vencido</th>
                                        <th style="width: 12%;">Qtd.</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyVencidos">
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
        </div>
    </main>

<?php include __DIR__ . '/../partials/footer.php'; ?>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../assets/js/api.js"></script>
    <script src="../assets/js/utils.js"></script>
    <script src="../assets/js/alertas.js"></script>
</body>
</html>
