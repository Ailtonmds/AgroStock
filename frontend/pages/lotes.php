<?php
require_once __DIR__ . '/../partials/page_auth.php';

$paginaAtual = 'lotes';
$tituloPagina = 'Lotes';
$subtituloPagina = 'Gerencie os lotes dos produtos';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lotes | AgroStock</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<?php include __DIR__ . '/../partials/sidebar.php'; ?>

        <section class="page-header-flex">
            <div class="page-header-section">
                <span class="badge-pagina">Estoque</span>
                <h1>Lotes</h1>
                <p class="text-secondary mb-0">Gerencie os lotes dos produtos</p>
            </div>
            <div class="page-header-actions">
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalLote">
                    <i class="bi bi-plus-lg me-1"></i> Novo lote
                </button>
            </div>
        </section>

        <!-- Filtros -->
        <div class="card mb-4">
            <div class="card-body p-3 p-md-4">
                <div class="row g-3 align-items-end">
                    <div class="col-md-6 col-lg-4">
                        <label class="form-label fw-semibold">Filtrar por produto</label>
                        <select class="form-select" id="filtroProduto">
                            <option value="">Todos os produtos</option>
                        </select>
                    </div>
                    <div class="col-md-4 col-lg-3">
                        <label class="form-label fw-semibold">Status de validade</label>
                        <select class="form-select" id="filtroStatusValidade">
                            <option value="">Todos</option>
                            <option value="vencidos">Vencidos</option>
                            <option value="proximos">Próximos do vencimento</option>
                            <option value="ok">Válidos</option>
                        </select>
                    </div>
                    <div class="col-md-2 col-lg-2 d-grid">
                        <button class="btn btn-outline-primary" id="btnAplicarFiltro"><i class="bi bi-search me-1"></i> Buscar</button>
                    </div>
                    <div class="col-md-12 col-lg-3 d-grid">
                        <button class="btn btn-outline-secondary" id="btnLimparFiltro"><i class="bi bi-x-lg me-1"></i> Limpar</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0" id="tabelaLotes">
                        <thead class="table-light">
                            <tr>
                                <th style="width: 24%;">Produto</th>
                                <th style="width: 16%;">Número do Lote</th>
                                <th style="width: 14%;">Fabricação</th>
                                <th style="width: 14%;">Validade</th>
                                <th style="width: 14%;">Qtd. Disponível</th>
                                <th style="width: 12%;">Status</th>
                                <th class="text-end" style="width: 12%;">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyLotes">
                            <tr>
                                <td colspan="7" class="text-center text-secondary py-4">
                                    <span class="spinner-border spinner-border-sm me-1"></span> Carregando...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal Lote -->
    <div class="modal fade" id="modalLote" tabindex="-1" aria-labelledby="modalLoteLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalLoteLabel">Novo Lote</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <form id="formLote">
                    <div class="modal-body">
                        <input type="hidden" name="id" id="loteId">

                        <div class="mb-3">
                            <label for="produto_id" class="form-label">Produto <span class="text-danger">*</span></label>
                            <select class="form-select" id="produto_id" name="produto_id" required>
                                <option value="">Selecione um produto</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label for="numero_lote" class="form-label">Número do Lote <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="numero_lote" name="numero_lote" required maxlength="100">
                        </div>

                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label for="data_fabricacao" class="form-label">Data de Fabricação</label>
                                <input type="date" class="form-control" id="data_fabricacao" name="data_fabricacao">
                            </div>
                            <div class="col-md-6">
                                <label for="data_validade" class="form-label">Data de Validade <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" id="data_validade" name="data_validade" required>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="quantidade" class="form-label">Quantidade Inicial <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" id="quantidade" name="quantidade" required min="1" value="1">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-ghost" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-success" id="btnSalvarLote">
                            <i class="bi bi-check-lg me-1"></i> Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

<?php include __DIR__ . '/../partials/footer.php'; ?>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../assets/js/api.js"></script>
    <script src="../assets/js/utils.js"></script>
    <script src="../assets/js/lotes.js"></script>
</body>
</html>
