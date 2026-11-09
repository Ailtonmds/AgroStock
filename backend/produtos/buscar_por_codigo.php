<?php
/**
 * Buscar produto por código de barras
 * Endpoint: GET produtos/buscar_por_codigo.php?codigo_barras=...
 * Retorna dados do produto e seus lotes disponíveis
 */

require_once __DIR__ . '/../config/conexao.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../auth/verificar_sessao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

$codigoBarras = trim($input['codigo_barras'] ?? $_GET['codigo_barras'] ?? '');

if (!$codigoBarras) {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Código de barras é obrigatório.']);
    exit;
}

try {
    // Buscar produto pelo código de barras
    $stmt = $pdo->prepare('
        SELECT p.id, p.nome, p.descricao, p.unidade_medida, p.estoque_minimo,
               p.localizacao, p.codigo_barras, p.ativo, p.criado_em,
               c.id as categoria_id, c.nome as categoria_nome
        FROM produtos p
        INNER JOIN categorias c ON p.categoria_id = c.id
        WHERE p.codigo_barras = :codigo_barras AND p.ativo = 1
        LIMIT 1
    ');
    $stmt->execute(['codigo_barras' => $codigoBarras]);
    $produto = $stmt->fetch();

    if (!$produto) {
        http_response_code(404);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Produto não encontrado para este código de barras.'
        ]);
        exit;
    }

    // Buscar lotes disponíveis para este produto
    $stmt = $pdo->prepare('
        SELECT l.id as lote_id, l.numero_lote, l.data_validade, l.data_fabricacao,
               pl.quantidade as quantidade_disponivel
        FROM produto_lote pl
        INNER JOIN lotes l ON pl.lote_id = l.id
        WHERE pl.produto_id = :produto_id
        ORDER BY l.data_validade ASC
    ');
    $stmt->execute(['produto_id' => $produto['id']]);
    $lotes = $stmt->fetchAll();

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Produto encontrado.',
        'dados' => [
            'produto' => $produto,
            'lotes' => $lotes
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao buscar produto.'
    ]);
}
