<?php
/**
 * Verificação de sessão válida
 * Incluir este arquivo no início de todos os endpoints protegidos
 */

require_once __DIR__ . '/../config/conexao.php';
require_once __DIR__ . '/../config/config.php';

if (empty($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Sessão expirada ou não autenticado. Faça login novamente.'
    ]);
    exit;
}

// Opcional: verificar se o usuário ainda existe e está ativo no banco
try {
    $stmt = $pdo->prepare('SELECT id, usuario, ativo FROM usuarios WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $_SESSION['usuario_id']]);
    $usuario = $stmt->fetch();
    
    if (!$usuario || !$usuario['ativo']) {
        session_destroy();
        http_response_code(401);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Usuário não encontrado ou inativo. Faça login novamente.'
        ]);
        exit;
    }
    
    // Atualizar dados da sessão se necessário
    $_SESSION['usuario'] = $usuario['usuario'];
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao verificar sessão.'
    ]);
    exit;
}

