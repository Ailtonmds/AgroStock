<?php
/**
 * CRUD de códigos de fornecedor (códigos de barras externos associados a produtos).
 *
 * Endpoints:
 *   GET    produtos/codigos_fornecedores.php?produto_id=X   -> listar
 *   POST   produtos/codigos_fornecedores.php                -> cadastrar (JSON)
 *   DELETE produtos/codigos_fornecedores.php?id=X           -> excluir
 *
 * Regras:
 * - Cada código deve possuir um produto associado.
 * - Um produto poderá possuir vários códigos de fornecedores.
 * - Não permitir códigos duplicados (UNIQUE em codigo_barras).
 * - Registrar a origem do código.
 * - Preservar o código original recebido do fabricante (zeros iniciais etc.).
 */

require_once __DIR__ . '/../config/conexao.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../auth/verificar_sessao.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $produto_id = isset($_GET['produto_id']) ? (int) $_GET['produto_id'] : 0;

    try {
        $sql = '
            SELECT cf.id, cf.produto_id, cf.codigo_barras, cf.tipo_codigo, cf.origem, cf.criado_em,
                   p.nome AS produto_nome
            FROM codigos_fornecedores cf
            INNER JOIN produtos p ON p.id = cf.produto_id
            WHERE 1=1';
        $params = [];

        if ($produto_id > 0) {
            $sql .= ' AND cf.produto_id = :produto_id';
            $params['produto_id'] = $produto_id;
        }

        $sql .= ' ORDER BY cf.criado_em DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $codigos = $stmt->fetchAll();

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Códigos de fornecedor listados com sucesso.',
            'dados' => $codigos
        ]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao listar códigos de fornecedor.']);
        exit;
    }
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input === null) {
        $input = $_POST;
    }

    $produto_id = (int) ($input['produto_id'] ?? 0);
    $codigo_barras = trim($input['codigo_barras'] ?? '');
    $tipo_codigo = trim($input['tipo_codigo'] ?? null);
    $origem = trim($input['origem'] ?? null);

    if ($produto_id <= 0 || $codigo_barras === '') {
        http_response_code(422);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Produto e código de barras são obrigatórios.']);
        exit;
    }

    try {
        // Verificar se produto existe
        $stmt = $pdo->prepare('SELECT id FROM produtos WHERE id = :id AND ativo = 1');
        $stmt->execute(['id' => $produto_id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Produto não encontrado ou inativo.']);
            exit;
        }

        // Verificar duplicidade do código
        $stmt = $pdo->prepare('SELECT id FROM codigos_fornecedores WHERE codigo_barras = :codigo');
        $stmt->execute(['codigo' => $codigo_barras]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Este código de barras já está cadastrado.']);
            exit;
        }

        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'INSERT INTO codigos_fornecedores (produto_id, codigo_barras, tipo_codigo, origem) 
             VALUES (:produto_id, :codigo_barras, :tipo_codigo, :origem)'
        );
        $stmt->execute([
            'produto_id' => $produto_id,
            'codigo_barras' => $codigo_barras,
            'tipo_codigo' => $tipo_codigo,
            'origem' => $origem,
        ]);
        $id = $pdo->lastInsertId();
        $pdo->commit();

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Código de fornecedor cadastrado com sucesso.',
            'dados' => ['id' => $id]
        ]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ($e->getCode() === '23000') {
            http_response_code(409);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Este código de barras já está cadastrado.']);
        } else {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao cadastrar código de fornecedor.']);
        }
    }
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($id <= 0) {
        http_response_code(422);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID é obrigatório.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare('SELECT id FROM codigos_fornecedores WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Código de fornecedor não encontrado.']);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM codigos_fornecedores WHERE id = :id');
        $stmt->execute(['id' => $id]);

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Código de fornecedor excluído com sucesso.'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao excluir código de fornecedor.']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
