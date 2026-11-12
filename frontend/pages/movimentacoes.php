<?php
require_once __DIR__ . '/../partials/page_auth.php';

$paginaAtual = 'movimentacoes';
$tituloPagina = 'Movimentações';
$subtituloPagina = 'Visualize todas as entradas e saídas do almoxarifado';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Movimentações | AgroStock</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<?php include __DIR__ . '/../partials/sidebar.php'; ?>

        <section class="page-header-flex">
            <div class="page-header-section">
                <span class="badge-pagina">Estoque</span>
                <h1>Histórico de Movimentações</h1>
                <p class="text-secondary mb-0">Visualize todas as entradas e saídas do almoxarifado</p>
            </div>
            <div class="page-header-actions">
                <a href="entrada.php" class="btn btn-outline-secondary"><i class="bi bi-arrow-down-circle me-1"></i> Entrada</a>
                <a href="saida.php" class="btn btn-outline-secondary"><i class="bi bi-arrow-up-circle me-1"></i> Saída</a>
            </div>
        </section>

        <!-- Filtros -->
        <div class="card mb-4">
            <div class="card-body p-3 p-md-4">
                <form id="formFiltros" class="row g-3">
                    <div class="col-md-3">
                        <label for="data_inicio" class="form-label">Data Início</label>
                        <input type="date" class="form-control" id="data_inicio" name="data_inicio">
                    </div>
                    <div class="col-md-3">
                        <label for="data_fim" class="form-label">Data Fim</label>
                        <input type="date" class="form-control" id="data_fim" name="data_fim">
                    </div>
                    <div class="col-md-3">
                        <label for="produto_id" class="form-label">Produto</label>
                        <select class="form-select" id="produto_id" name="produto_id">
                            <option value="">Todos</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label for="tipo" class="form-label">Tipo</label>
                        <select class="form-select" id="tipo" name="tipo">
                            <option value="">Todos</option>
                            <option value="entrada">Entrada</option>
                            <option value="saida">Saída</option>
                        </select>
                    </div>
                    <div class="col-12 d-flex gap-2">
                        <button type="submit" class="btn btn-primary"><i class="bi bi-search me-1"></i> Filtrar</button>
                        <button type="button" class="btn btn-ghost" id="btnLimparFiltros"><i class="bi bi-x-lg me-1"></i> Limpar</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Tabela de movimentações -->
        <div class="card">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0" id="tabelaMovimentacoes">
                        <thead class="table-light">
                            <tr>
                                <th style="width: 16%;">Data/Hora</th>
                                <th style="width: 18%;">Produto</th>
                                <th style="width: 14%;">Lote</th>
                                <th style="width: 12%;">Validade</th>
                                <th style="width: 10%;">Tipo</th>
                                <th style="width: 10%;">Quantidade</th>
                                <th style="width: 14%;">Usuário</th>
                                <th style="width: 16%;">Observação</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyMovimentacoes">
                            <tr>
                                <td colspan="8" class="text-center text-secondary py-4">
                                    <span class="spinner-border spinner-border-sm me-1"></span> Carregando...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Paginação -->
                <div class="card-footer bg-transparent border-0 px-4 py-3" id="paginacaoContainer">
                    <nav aria-label="Paginação">
                        <ul class="pagination pagination-sm mb-0 justify-content-center" id="paginacao"></ul>
                    </nav>
                    <div class="text-center text-secondary small mt-2" id="paginacaoInfo"></div>
                </div>
            </div>
        </div>
    </main>

<?php include __DIR__ . '/../partials/footer.php'; ?>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../assets/js/api.js"></script>
    <script src="../assets/js/utils.js"></script>
    <script src="../assets/js/estoque_movimentacoes.js"></script>
</body>
</html>
