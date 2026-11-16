<?php
/**
 * Buscar produto ou lote por código de barras.
 *
 * Endpoint: GET produtos/buscar_por_codigo.php?codigo_barras=...
 *
 * Identifica se o código pertence a:
 *  - um lote (código interno AG00000001) -> tipo "lote"
 *  - um código de fornecedor de produto -> tipo "fornecedor"
 *  - o código de barras direto da tabela produtos -> tipo "produto"
 *
 * Retorna os dados do produto/lote encontrado e, quando aplicável,
 * os lotes disponíveis do produto. Não registra movimentação automaticamente.
 */

require_once __DIR__ . '/../config/conexao.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../auth/verificar_sessao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

$codigoBarras = trim($_GET['codigo_barras'] ?? '');

if (!$codigoBarras) {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Código de barras é obrigatório.']);
    exit;
}

try {
    // ---------------------------------------------------------------
    // 1. Código interno de lote (AG00000001)
    // ---------------------------------------------------------------
    $stmt = $pdo->prepare('
        SELECT 
            l.id AS lote_id,
            l.numero_lote,
            l.codigo_barras_interno,
            l.data_fabricacao,
            l.data_validade,
            pl.produto_id,
            p.id AS produto_id,
            p.nome AS produto_nome,
            p.descricao,
            p.unidade_medida,
            p.localizacao,
            pl.quantidade
        FROM lotes l
        INNER JOIN produto_lote pl ON pl.lote_id = l.id
        INNER JOIN produtos p ON p.id = pl.produto_id
        WHERE l.codigo_barras_interno = :codigo
        LIMIT 1
    ');
    $stmt->execute(['codigo' => $codigoBarras]);
    $lote = $stmt->fetch();

    if ($lote) {
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Código interno de lote encontrado.',
            'tipo' => 'lote',
            'dados' => [
                'lote' => [
                    'id' => (int) $lote['lote_id'],
                    'numero_lote' => $lote['numero_lote'],
                    'codigo_barras_interno' => $lote['codigo_barras_interno'],
                    'data_fabricacao' => $lote['data_fabricacao'],
                    'data_validade' => $lote['data_validade'],
                    'quantidade' => (int) $lote['quantidade'],
                ],
                'produto' => [
                    'id' => (int) $lote['produto_id'],
                    'nome' => $lote['produto_nome'],
                    'descricao' => $lote['descricao'],
                    'unidade_medida' => $lote['unidade_medida'],
                    'localizacao' => $lote['localizacao'],
                ],
            ],
        ]);
        exit;
    }

    // ---------------------------------------------------------------
    // 2. Código de fornecedor (tabela codigos_fornecedores)
    // ---------------------------------------------------------------
    $stmt = $pdo->prepare('
        SELECT 
            cf.id,
            cf.produto_id,
            cf.codigo_barras,
            cf.tipo_codigo,
            cf.origem,
            p.id AS produto_id,
            p.nome AS produto_nome,
            p.descricao,
            p.unidade_medida,
            p.localizacao,
            p.ativo
        FROM codigos_fornecedores cf
        INNER JOIN produtos p ON p.id = cf.produto_id
        WHERE cf.codigo_barras = :codigo
        LIMIT 1
    ');
    $stmt->execute(['codigo' => $codigoBarras]);
    $fornecedor = $stmt->fetch();

    if ($fornecedor) {
        if (!$fornecedor['ativo']) {
            http_response_code(404);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'O produto associado a este código está inativo.'
            ]);
            exit;
        }

        // Buscar lotes disponíveis para este produto
        $stmt = $pdo->prepare('
            SELECT l.id, l.numero_lote, l.codigo_barras_interno, l.data_validade, l.data_fabricacao,
                   pl.quantidade
            FROM produto_lote pl
            INNER JOIN lotes l ON pl.lote_id = l.id
            WHERE pl.produto_id = :produto_id
            ORDER BY l.data_validade ASC
        ');
        $stmt->execute(['produto_id' => (int) $fornecedor['produto_id']]);
        $lotes = $stmt->fetchAll();

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Produto encontrado pelo código do fornecedor.',
            'tipo' => 'fornecedor',
            'dados' => [
                'codigo_fornecedor' => [
                    'id' => (int) $fornecedor['id'],
                    'codigo_barras' => $fornecedor['codigo_barras'],
                    'tipo_codigo' => $fornecedor['tipo_codigo'],
                    'origem' => $fornecedor['origem'],
                ],
                'produto' => [
                    'id' => (int) $fornecedor['produto_id'],
                    'nome' => $fornecedor['produto_nome'],
                    'descricao' => $fornecedor['descricao'],
                    'unidade_medida' => $fornecedor['unidade_medida'],
                    'localizacao' => $fornecedor['localizacao'],
                ],
                'lotes' => $lotes,
            ],
        ]);
        exit;
    }

    // ---------------------------------------------------------------
    // 3. Código de barras direto da tabela produtos (coluna codigo_barras)
    // ---------------------------------------------------------------
    $stmt = $pdo->prepare('
        SELECT p.id, p.nome, p.descricao, p.unidade_medida, p.estoque_minimo,
               p.localizacao, p.codigo_barras, p.ativo, p.criado_em,
               c.id as categoria_id, c.nome as categoria_nome
        FROM produtos p
        INNER JOIN categorias c ON p.categoria_id = c.id
        WHERE p.codigo_barras = :codigo AND p.ativo = 1
        LIMIT 1
    ');
    $stmt->execute(['codigo' => $codigoBarras]);
    $produto = $stmt->fetch();

    if (!$produto) {
        http_response_code(404);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Código de barras não encontrado (não corresponde a lote, fornecedor ou produto).'
        ]);
        exit;
    }

    // Buscar lotes disponíveis para este produto
    $stmt = $pdo->prepare('
        SELECT l.id, l.numero_lote, l.codigo_barras_interno, l.data_validade, l.data_fabricacao,
               pl.quantidade
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
        'tipo' => 'produto',
        'dados' => [
            'produto' => $produto,
            'lotes' => $lotes
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao buscar código de barras.'
    ]);
}
