<?php
require_once __DIR__ . '/../partials/page_auth.php';

$paginaAtual = 'estoque';
$tituloPagina = 'Estoque';
$subtituloPagina = 'Escolha uma operação para continuar';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estoque | AgroStock</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<?php include __DIR__ . '/../partials/sidebar.php'; ?>

        <section class="page-header-flex">
            <div class="page-header-section">
                <span class="badge-pagina">Estoque</span>
                <h1>Estoque</h1>
                <p class="text-secondary mb-0">Escolha uma operação para continuar</p>
            </div>
        </section>

        <div class="row g-4">
            <div class="col-md-4">
                <a class="card h-100 border-0 shadow-suave text-decoration-none text-reset" href="entrada.php">
                    <div class="card-body p-5 text-center">
                        <span class="stat-icon mb-3 d-inline-block" style="background: var(--verde-suave); color: var(--verde);"><i class="bi bi-arrow-down-circle"></i></span>
                        <h2 class="h5 fw-bold mb-2">Registrar entrada</h2>
                        <p class="text-secondary mb-0">Adicione produtos a um lote existente.</p>
                    </div>
                </a>
            </div>
            <div class="col-md-4">
                <a class="card h-100 border-0 shadow-suave text-decoration-none text-reset" href="saida.php">
                    <div class="card-body p-5 text-center">
                        <span class="stat-icon mb-3 d-inline-block" style="background: var(--vermelho-suave); color: var(--vermelho);"><i class="bi bi-arrow-up-circle"></i></span>
                        <h2 class="h5 fw-bold mb-2">Registrar saída</h2>
                        <p class="text-secondary mb-0">Retire produtos sem permitir estoque negativo.</p>
                    </div>
                </a>
            </div>
            <div class="col-md-4">
                <a class="card h-100 border-0 shadow-suave text-decoration-none text-reset" href="movimentacoes.php">
                    <div class="card-body p-5 text-center">
                        <span class="stat-icon mb-3 d-inline-block" style="background: var(--verde-suave); color: var(--verde);"><i class="bi bi-clock-history"></i></span>
                        <h2 class="h5 fw-bold mb-2">Ver movimentações</h2>
                        <p class="text-secondary mb-0">Consulte o histórico de entradas e saídas.</p>
                    </div>
                </a>
            </div>
        </div>

<?php include __DIR__ . '/../partials/footer.php'; ?>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../assets/js/api.js"></script>
    <script src="../assets/js/utils.js"></script>
</body>
</html>
