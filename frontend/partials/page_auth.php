<?php
/**
 * Proteção de páginas do frontend
 * Verifica se o usuário está autenticado; caso contrário, redireciona ao login.
 * Não envia headers JSON (apenas redirecionamento).
 */

// Iniciar sessão se ainda não estiver iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (empty($_SESSION['usuario_id'])) {
    header('Location: index.html');
    exit;
}