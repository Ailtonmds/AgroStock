<?php

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

<<<<<<< HEAD
$host = getenv('DB_HOST') !== false ? getenv('DB_HOST') : '127.0.0.1';
$port = getenv('DB_PORT') !== false ? getenv('DB_PORT') : '3306';
$db = getenv('DB_NAME') !== false ? getenv('DB_NAME') : 'almoxarifado';
$user = getenv('DB_USER') !== false ? getenv('DB_USER') : 'root';
$pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
=======
$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$db = getenv('DB_DATABASE') ?: 'almoxarifado';
$user = getenv('DB_USERNAME') ?: 'ailton';
$pass = getenv('DB_PASSWORD') ?: 'cruzeiro';
>>>>>>> melhoria-frontend-agrostock

$dsnServidor = "mysql:host={$host};port={$port};charset=utf8mb4";
$opcoes = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO("{$dsnServidor};dbname={$db}", $user, $pass, $opcoes);
} catch (PDOException $e) {
    try {
        $pdo = new PDO($dsnServidor, $user, $pass, $opcoes);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `{$db}`");
    } catch (PDOException $fallback) {
        error_log('AgroStock: falha na conexão com o banco de dados: ' . $fallback->getMessage());
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Não foi possível conectar ao banco de dados. Confira as variáveis DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASS.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
