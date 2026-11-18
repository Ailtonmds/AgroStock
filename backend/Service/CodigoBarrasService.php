<?php

namespace App\Service;

require_once __DIR__ . '/../../vendor/autoload.php';

/**
 * Serviço de geração de códigos de barras (Picqer PHP Barcode Generator).
 *
 * Gera códigos de barras no formato Code 128, localmente, sem depender
 * de serviços externos. A saída pode ser SVG (para exibição/impressão).
 *
 * Não salva imagens no banco de dados: armazena-se somente o conteúdo
 * textual do código de barras.
 */

use Picqer\Barcode\Types\TypeCode128;
use Picqer\Barcode\Renderers\SvgRenderer;

class CodigoBarrasService
{
    public const FORMATO = 'code128';
    public const PREFIXO_INTERNO = 'AG';

    private SvgRenderer $renderer;

    public function __construct()
    {
        $this->renderer = new SvgRenderer();
    }

    /**
     * Gera a representação de código de barras (objeto Barcode) para um código textual.
     *
     * @param string $codigo Conteúdo textual do código de barras
     * @return \Picqer\Barcode\Barcode
     * @throws \Picqer\Barcode\Exceptions\BarcodeException
     * @throws \Picqer\Barcode\Exceptions\InvalidCharacterException
     * @throws \Picqer\Barcode\Exceptions\InvalidLengthException
     */
    public function gerarBarcode(string $codigo): \Picqer\Barcode\Barcode
    {
        return (new TypeCode128())->getBarcode($codigo);
    }

    /**
     * Renderiza o código de barras em SVG.
     *
     * @param \Picqer\Barcode\Barcode $barcode Objeto de código de barras
     * @param int $width Largura desejada em pixels
     * @param int $height Altura desejada em pixels
     * @return string Conteúdo SVG
     * @throws \Picqer\Barcode\Exceptions\InvalidOptionException
     */
    public function renderSvg(\Picqer\Barcode\Barcode $barcode, int $width = 400, int $height = 80): string
    {
        return $this->renderer->render($barcode, $width, $height);
    }

    /**
     * Gera o SVG completo de um código de barras Code 128 a partir do texto.
     *
     * @param string $codigo Conteúdo textual do código de barras
     * @param int $width Largura desejada em pixels
     * @param int $height Altura desejada em pixels
     * @return string Conteúdo SVG
     */
    public function gerarSvg(string $codigo, int $width = 400, int $height = 80): string
    {
        $barcode = $this->gerarBarcode($codigo);
        return $this->renderSvg($barcode, $width, $height);
    }

    /**
     * Gera o próximo código interno de lote seguindo o padrão AG00000001.
     *
     * O número é baseado no maior identificador interno já existente, somando 1,
     * preenchido com zeros à esquerda até 8 dígitos.
     *
     * @param \PDO $pdo Conexão com o banco de dados
     * @return string Código interno gerado (ex: AG00000001)
     * @throws \PDOException
     */
    /**
     * Sanitiza um código de barras recebido de leitor (scanner).
     *
     * Leitores de código de barras costumam enviar automaticamente um
     * caractere Enter (nova linha) ao final da leitura. Este método remove
     * quebras de linha, carriage returns e espaços em branco nas extremidades,
     * equivalente a prevenir o comportamento do Enter no frontend.
     *
     * @param string $codigo Código bruto lido pelo scanner
     * @return string Código sanitizado
     */
    public function sanitizarCodigoScanner(string $codigo): string
    {
        // Remove Enter (\r, \n), tabs e espaços das extremidades
        return trim(preg_replace('/\s+/', '', $codigo));
    }

    public function gerarCodigoInternoLote(\PDO $pdo): string
    {
        $stmt = $pdo->query("SELECT MAX(codigo_barras_interno) AS ultimo FROM lotes WHERE codigo_barras_interno IS NOT NULL");
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        $ultimo = $row['ultimo'] ?? null;

        $numero = 1;
        if ($ultimo !== null && $ultimo !== '') {
            // Remove o prefixo (ex: "AG") e converte o restante para inteiro
            $numerico = preg_replace('/\D/', '', $ultimo);
            if ($numerico !== '') {
                $numero = (int) $numerico + 1;
            }
        }

        return self::PREFIXO_INTERNO . str_pad((string) $numero, 8, '0', STR_PAD_LEFT);
    }
}
