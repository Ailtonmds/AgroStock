<?php
require_once __DIR__ . '/../partials/page_auth.php';

$paginaAtual = 'categorias';
$tituloPagina = 'Categorias';
$subtituloPagina = 'Gerencie as categorias de produtos';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Categorias | AgroStock</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<?php include __DIR__ . '/../partials/sidebar.php'; ?>

        <section class="page-header-flex">
            <div class="page-header-section">
                <span class="badge-pagina">Estoque</span>
                <h1>Categorias</h1>
                <p class="text-secondary mb-0">Gerencie as categorias de produtos</p>
            </div>
            <div class="page-header-actions">
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalCategoria">
                    <i class="bi bi-plus-lg me-1"></i> Nova categoria
                </button>
            </div>
        </section>

        <div class="card">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0" id="tabelaCategorias">
                        <thead class="table-light">
                            <tr>
                                <th style="width: 30%;">Nome</th>
                                <th style="width: 40%;">Descrição</th>
                                <th style="width: 15%;">Status</th>
                                <th class="text-end" style="width: 15%;">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyCategorias">
                            <tr>
                                <td colspan="4" class="text-center text-secondary py-4">
                                    <span class="spinner-border spinner-border-sm me-1"></span> Carregando...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    <!-- Modal Categoria -->
    <div class="modal fade" id="modalCategoria" tabindex="-1" aria-labelledby="modalCategoriaLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalCategoriaLabel">Nova Categoria</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <form id="formCategoria">
                    <div class="modal-body">
                        <input type="hidden" name="id" id="categoriaId">

                        <div class="mb-3">
                            <label for="nome" class="form-label">Nome <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="nome" name="nome" required maxlength="100">
                        </div>

                        <div class="mb-3">
                            <label for="descricao" class="form-label">Descrição</label>
                            <textarea class="form-control" id="descricao" name="descricao" rows="3"></textarea>
                        </div>

                        <div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" id="ativo" name="ativo" checked>
                            <label class="form-check-label" for="ativo">Ativa</label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-ghost" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-success" id="btnSalvarCategoria">
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
    <script src="../assets/js/categorias.js"></script>
</body>
</html>
