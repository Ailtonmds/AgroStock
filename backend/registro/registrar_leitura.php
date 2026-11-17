<?php
/**
 * Registrar uma leitura do scanner de código de barras no histórico.
 *
 * Endpoint: POST registro/registrar_leitura.php
 *
 * Corpo JSON:
 *   {
 *     "codigo_lido": "7891234567890",
 *     "produto_id": 1,              // opcional, null se não encontrado
 *     "resultado": "sucesso",        // sucesso | nao_encontrado | invalido | erro_comunicacao
 *     "tela_origem": "entrada"       // entrada | saida | produtos | ...
 *   }
 *
 * Uma leitura não significa necessariamente uma movimentação de estoque.
 * Este histórico é separado da tabela movimentacoes.
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

$codigoLido = trim($input['codigo_lido'] ?? '');
$produtoId = isset($input['produto_id']) ? (int) $input['produto_id'] : null;
$resultado = $input['resultado'] ?? null;
$telaOrigem = trim($input['tela_origem'] ?? '');
$usuarioId = $_SESSION['usuario_id'] ?? null;

if ($codigoLido === '') {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Código lido é obrigatório.']);
    exit;
}

$resultadosValidos = ['sucesso', 'nao_encontrado', 'invalido', 'erro_comunicacao'];
if (!in_array($resultado, $resultadosValidos)) {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Resultado inválido.']);
    exit;
}

if ($telaOrigem === '') {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Tela de origem é obrigatória.']);
    exit;
}

try {
    // Validar produto_id se informado
    if ($produtoId !== null && $produtoId > 0) {
        $stmt = $pdo->prepare('SELECT id FROM produtos WHERE id = :id');
        $stmt->execute(['id' => $produtoId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Produto não encontrado.']);
            exit;
        }
    }

    $stmt = $pdo->prepare(
        'INSERT INTO historico_leituras_scanner 
            (codigo_lido, produto_id, resultado, tela_origem, usuario_id) 
         VALUES (:codigo_lido, :produto_id, :resultado, :tela_origem, :usuario_id)'
    );
    $stmt->execute([
        'codigo_lido' => $codigoLido,
        'produto_id' => $produtoId > 0 ? $produtoId : null,
        'resultado' => $resultado,
        'tela_origem' => $telaOrigem,
        'usuario_id' => $usuarioId,
    ]);

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Leitura registrada no histórico.',
        'dados' => ['id' => $pdo->lastInsertId()]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao registrar leitura.']);
}
