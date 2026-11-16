<?php
/**
 * Editar produto
 */

require_once __DIR__ . '/../config/conexao.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../auth/verificar_sessao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if ($input === null) {
    $input = $_POST;
}

$id = (int) ($input['id'] ?? 0);
$categoria_id = (int) ($input['categoria_id'] ?? 0);
$nome = trim($input['nome'] ?? '');
$descricao = trim($input['descricao'] ?? '');
$unidade_medida = trim($input['unidade_medida'] ?? '');
$estoque_minimo = (int) ($input['estoque_minimo'] ?? 0);
$localizacao = trim($input['localizacao'] ?? '');
$ativo = isset($input['ativo']) ? (bool) $input['ativo'] : true;
$codigo_barras = trim($input['codigo_barras'] ?? null);

if ($id <= 0 || $categoria_id <= 0 || $nome === '' || $unidade_medida === '') {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => 'ID, categoria, nome e unidade de medida são obrigatórios.']);
    exit;
}

if ($estoque_minimo < 0) {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Estoque mínimo não pode ser negativo.']);
    exit;
}

try {
    // Verificar se produto existe
    $stmt = $pdo->prepare('SELECT id FROM produtos WHERE id = :id');
    $stmt->execute(['id' => $id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Produto não encontrado.']);
        exit;
    }

    // Verificar se categoria existe
    $stmt = $pdo->prepare('SELECT id FROM categorias WHERE id = :id AND ativo = 1');
    $stmt->execute(['id' => $categoria_id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Categoria não encontrada ou inativa.']);
        exit;
    }

    $stmt = $pdo->prepare(
        'UPDATE produtos 
         SET categoria_id = :categoria_id, nome = :nome, descricao = :descricao, 
             unidade_medida = :unidade_medida, estoque_minimo = :estoque_minimo, 
             localizacao = :localizacao, ativo = :ativo, codigo_barras = :codigo_barras 
         WHERE id = :id'
    );
    $stmt->execute([
        'categoria_id' => $categoria_id,
        'nome' => $nome,
        'descricao' => $descricao,
        'unidade_medida' => $unidade_medida,
        'estoque_minimo' => $estoque_minimo,
        'localizacao' => $localizacao,
        'ativo' => $ativo,
        'codigo_barras' => $codigo_barras === '' ? null : $codigo_barras,
        'id' => $id
    ]);

    // Atualizar códigos de fornecedor associados ao produto (substitui os existentes)
    $codigosFornecedor = $input['codigos_fornecedor'] ?? null;
    $stmtCfDelete = $pdo->prepare('DELETE FROM codigos_fornecedores WHERE produto_id = :produto_id');
    $stmtCfDelete->execute(['produto_id' => $id]);

    $lista = [];
    if ($codigosFornecedor !== null && $codigosFornecedor !== '') {
        if (is_string($codigosFornecedor)) {
            $decodificado = json_decode($codigosFornecedor, true);
            $lista = is_array($decodificado) ? $decodificado : [];
        } elseif (is_array($codigosFornecedor)) {
            $lista = $codigosFornecedor;
        }
    }
    if (!empty($lista)) {
        $stmtCf = $pdo->prepare(
            'INSERT INTO codigos_fornecedores (produto_id, codigo_barras, tipo_codigo, origem) 
             VALUES (:produto_id, :codigo_barras, :tipo_codigo, :origem)'
        );
        foreach ($lista as $cf) {
            $cb = trim($cf['codigo_barras'] ?? '');
            if ($cb === '') continue;
            $chk = $pdo->prepare('SELECT id FROM codigos_fornecedores WHERE codigo_barras = :codigo');
            $chk->execute(['codigo' => $cb]);
            if ($chk->fetch()) continue;
            $stmtCf->execute([
                'produto_id' => $id,
                'codigo_barras' => $cb,
                'tipo_codigo' => null,
                'origem' => trim($cf['origem'] ?? '')
            ]);
        }
    }

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Produto atualizado com sucesso.',
        'dados' => ['id' => $id]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao atualizar produto.']);
}