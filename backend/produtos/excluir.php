<?php

require_once __DIR__ . '/../config/conexao.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../auth/verificar_sessao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

$id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);

if (!$id || $id <= 0) {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Informe um ID de produto válido.']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, ativo FROM produtos WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $produto = $stmt->fetch();

    if (!$produto) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Produto não encontrado.']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT
        EXISTS(SELECT 1 FROM produto_lote WHERE produto_id = :produto_lote_id)
        OR EXISTS(SELECT 1 FROM movimentacoes WHERE produto_id = :movimentacao_id)');
    $stmt->execute([
        'produto_lote_id' => $id,
        'movimentacao_id' => $id
    ]);
    $possuiVinculos = (bool) $stmt->fetchColumn();

    if ($possuiVinculos) {
        $stmt = $pdo->prepare('UPDATE produtos SET ativo = 0 WHERE id = :id');
        $stmt->execute(['id' => $id]);

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Produto desativado. Os lotes e o histórico de movimentações foram preservados.',
            'dados' => ['acao' => 'desativado']
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

<<<<<<< HEAD
    $stmt = $pdo->prepare('DELETE FROM produtos WHERE id = :id');
    $stmt->execute(['id' => $id]);

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Produto excluído permanentemente.',
        'dados' => ['acao' => 'excluido']
    ], JSON_UNESCAPED_UNICODE);
=======
    // Exclusão física (apenas se não houver vínculos ou forçar)
    if (!$temLotes && !$temMovimentacoes) {
        // Não há vínculos: excluir fisicamente
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare('DELETE FROM produto_lote WHERE produto_id = :id');
        $stmt->execute(['id' => $id]);
        
        $stmt = $pdo->prepare('DELETE FROM produtos WHERE id = :id');
        $stmt->execute(['id' => $id]);
        
        $pdo->commit();

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Produto excluído permanentemente.',
            'dados' => ['acao' => 'excluido']
        ]);
        exit;
    }

    if ($forcar) {
        // Forçar exclusão mesmo com vínculos
        $pdo->beginTransaction();
        
        // Excluir em ordem respeitando chaves estrangeiras:
        // 1. produto_lote (referencia produtos e lotes)
        // 2. movimentacoes (referencia produtos, lotes e usuarios)
        // 3. produtos
        $stmt = $pdo->prepare('DELETE FROM produto_lote WHERE produto_id = :id');
        $stmt->execute(['id' => $id]);
        
        $stmt = $pdo->prepare('DELETE FROM movimentacoes WHERE produto_id = :id');
        $stmt->execute(['id' => $id]);
        
        $stmt = $pdo->prepare('DELETE FROM produtos WHERE id = :id');
        $stmt->execute(['id' => $id]);
        
        $pdo->commit();

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Produto excluído permanentemente (forçado).',
            'dados' => ['acao' => 'excluido']
        ]);
        exit;
    }

    // Há vínculos e não forçar: apenas desativar
    $stmt = $pdo->prepare('UPDATE produtos SET ativo = 0 WHERE id = :id');
    $stmt->execute(['id' => $id]);

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Produto desativado (possui lotes/movimentações vinculados).',
        'dados' => ['acao' => 'desativado']
    ]);
>>>>>>> melhoria-frontend-agrostock
} catch (PDOException $e) {
    error_log('AgroStock: erro ao excluir produto: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Não foi possível excluir o produto.']);
}
