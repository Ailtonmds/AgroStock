<?php
session_start();
// Se já existe usuário, redireciona para o login
if (!empty($_SESSION['usuario_id'] ?? null)) {
    header('Location: index.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Criar Usuário | AgroStock</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <main class="login-container d-flex align-items-center justify-content-center">
        <section class="login-card" aria-labelledby="tituloCriar">
            <div class="card-brand">
                <img class="login-img-logo" src="../assets/img/logo.png" alt="Logo AgroStock">
                <h1>AgroStock</h1>
                <p>Sistema de Gerenciamento de Almoxarifado</p>
            </div>
            <div class="mb-4">
                <h2 id="tituloCriar" class="h4 mb-1">Criar usuário</h2>
                <p class="text-secondary small mb-0">Informe seus dados para criar a conta inicial.</p>
            </div>
            <form id="criarUsuarioForm">
                <div class="input-group mb-3">
                    <span class="input-group-text"><i class="bi bi-person"></i></span>
                    <input type="text" class="form-control" id="nome" name="nome" minlength="3" maxlength="150" required autocomplete="name" placeholder="Nome completo">
                </div>
                <div class="input-group mb-3">
                    <span class="input-group-text"><i class="bi bi-person-badge"></i></span>
                    <input type="text" class="form-control" id="usuario" name="usuario" minlength="3" maxlength="100" required autocomplete="username" placeholder="Usuário">
                </div>
                <div class="input-group mb-3">
                    <span class="input-group-text"><i class="bi bi-lock"></i></span>
                    <input type="password" class="form-control" id="senha" name="senha" minlength="6" required autocomplete="new-password" placeholder="Senha">
                </div>
                <div class="form-text">Mínimo 6 caracteres</div>
                <div class="input-group mb-3">
                    <span class="input-group-text"><i class="bi bi-shield"></i></span>
                    <select class="form-select" id="nivel_acesso" name="nivel_acesso">
                        <option value="admin">Administrador</option>
                        <option value="operador">Operador</option>
                    </select>
                </div>
                <div id="mensagemErro" class="alert alert-danger d-none small"></div>
                <div id="mensagemSucesso" class="alert alert-success d-none small"></div>
                <button type="submit" class="btn btn-success w-100 mt-3" id="btnCriar">
                    <span id="textoBotao">Criar usuário</span>
                    <span id="loading" class="spinner-border spinner-border-sm d-none"></span>
                </button>
                <div class="text-center mt-3"><a class="auth-link" href="index.html">Voltar ao login</a></div>
            </form>
            <div class="text-center mt-4"><small class="text-muted">Sistema interno • AgroStock</small></div>
        </section>
    </main>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../assets/js/api.js"></script>
    <script src="../assets/js/utils.js"></script>
    <script src="../assets/js/criar_usuario.js"></script>
</body>
</html>
