<?php

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

<<<<<<< HEAD
$isHttps = (
    (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
    || (($_SERVER['SERVER_PORT'] ?? null) == 443)
);
=======
// URL base da API (ajustar conforme necessário)
define('API_BASE_URL', '/backend');
>>>>>>> melhoria-frontend-agrostock

ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_secure', $isHttps ? '1' : '0');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!defined('DIAS_ALERTA_VALIDADE')) {
    define('DIAS_ALERTA_VALIDADE', 30);
}

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}

set_exception_handler(function (Throwable $exception): void {
    error_log('AgroStock: ' . $exception->getMessage());

    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro interno ao processar a requisição.'
<<<<<<< HEAD
    ], JSON_UNESCAPED_UNICODE);
=======
    ]);
>>>>>>> melhoria-frontend-agrostock
});
