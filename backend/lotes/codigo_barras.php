<?php
/**
 * Endpoint de SVG do código de barras interno de um lote.
 *
 * GET lotes/codigo_barras.php?id=<lote_id>
 *
 * Consulta o lote pelo identificador, valida a existência e gera o SVG
 * do código de barras interno (Code 128) usando a biblioteca Picqer.
 *
 * Retorna o conteúdo com Content-Type: image/svg+xml.
 * Não aceita conteúdo SVG arbitrário do frontend: o código é obtido do banco.
 */

require_once __DIR__ . '/../config/conexao.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../auth/verificar_sessao.php';
require_once __DIR__ . '/../Service/CodigoBarrasService.php';

use App\Service\CodigoBarrasService;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($id <= 0) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['sucesso' => false, 'mensagem' => 'ID do lote é obrigatório.']);
    exit;
}

try {
    // Consultar o lote pelo identificador (com validação de existência)
    $stmt = $pdo->prepare('
        SELECT l.id, l.numero_lote, l.codigo_barras_interno, p.nome AS produto_nome
        FROM lotes l
        INNER JOIN produto_lote pl ON pl.lote_id = l.id
        INNER JOIN produtos p ON p.id = pl.produto_id
        WHERE l.id = :id
        LIMIT 1
    ');
    $stmt->execute(['id' => $id]);
    $lote = $stmt->fetch();

    if (!$lote) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Lote não encontrado.'
        ]);
        exit;
    }

    $codigoInterno = $lote['codigo_barras_interno'];

    if (!$codigoInterno) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Este lote não possui código de barras interno.'
        ]);
        exit;
    }

    // Gerar o SVG com Picqer (Code 128)
    $service = new CodigoBarrasService();
    $svg = $service->gerarSvg($codigoInterno, 500, 80);

    // Retornar o conteúdo com Content-Type apropriado
    http_response_code(200);
    header('Content-Type: image/svg+xml; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    echo $svg;
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao gerar código de barras.'
    ]);
    exit;
}
