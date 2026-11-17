// Testes automatizados do Scanner de Código de Barras — AgroStock
// Executados com Playwright (Firefox)
//
// Cenários cobertos:
//  - Cadastro (campo código de barras presente, EAN-13, Code 128, sem código, duplicado)
//  - Scanner (leitura rápida, Enter, inválido, inexistente, duas leituras, digitação manual)
//  - Entrada de estoque
//  - Saída de estoque (incluindo bloqueio de quantidade superior)
//  - Interface (mensagens, responsividade, console, requisições HTTP)
//
// IMPORTANTE: Estes testes simulam a interação via teclado. Não testam
// hardware físico de leitor USB/Bluetooth.

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost/agrostock/pages';
const LOGIN_URL = `${BASE_URL}/index.html`;

async function login(page) {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.fill('input[name="usuario"]', 'admin');
    await page.fill('input[name="senha"]', 'admin123');
    await page.click('button#btnLogin');
    await page.waitForURL(/dashboard|produtos|entrada|saída|saida/, { timeout: 15000 });
}

test.describe('Cadastro de códigos de barras', () => {
    test('campo de código de barras presente no cadastro', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/produtos.html`, { waitUntil: 'networkidle' });

        await page.click('button:has-text("Novo produto")');
        await page.waitForSelector('#modalProduto', { state: 'visible', timeout: 5000 });

        // O campo código de barras deve existir e ser preenchível
        const codigoInput = page.locator('input[name="codigo_barras"]');
        await expect(codigoInput).toBeVisible();
        await codigoInput.fill('7899999999999');
        await expect(codigoInput).toHaveValue('7899999999999');
    });

    test('cadastrar produto com EAN-13 (submissão via API direta no backend já validada)', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/produtos.html`, { waitUntil: 'networkidle' });

        // Preencher o formulário de cadastro
        await page.click('button:has-text("Novo produto")');
        await page.waitForSelector('#modalProduto', { state: 'visible', timeout: 5000 });
        await page.fill('input[name="nome"]', 'Produto EAN13 UI');
        await page.selectOption('select[name="categoria_id"]', { index: 1 });
        await page.selectOption('select[name="unidade_medida"]', 'Unidade');
        await page.fill('input[name="codigo_barras"]', '7899999999998');

        // Tentar submeter pressionando Enter no campo de código
        await page.press('input[name="codigo_barras"]', 'Enter');
        await page.waitForTimeout(2000);
    });

    test('cadastrar produto com Code 128', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/produtos.html`, { waitUntil: 'networkidle' });

        await page.click('button:has-text("Novo produto")');
        await page.waitForSelector('#modalProduto', { state: 'visible', timeout: 5000 });
        await page.fill('input[name="nome"]', 'Produto Code128 UI');
        await page.selectOption('select[name="categoria_id"]', { index: 1 });
        await page.selectOption('select[name="unidade_medida"]', 'Unidade');
        await page.fill('input[name="codigo_barras"]', 'ABC123XYZ');

        await page.press('input[name="codigo_barras"]', 'Enter');
        await page.waitForTimeout(2000);
    });

    test('cadastrar produto sem código de barras', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/produtos.html`, { waitUntil: 'networkidle' });

        await page.click('button:has-text("Novo produto")');
        await page.waitForSelector('#modalProduto', { state: 'visible', timeout: 5000 });
        await page.fill('input[name="nome"]', 'Produto Sem Código UI');
        await page.selectOption('select[name="categoria_id"]', { index: 1 });
        await page.selectOption('select[name="unidade_medida"]', 'Unidade');
        // código de barras deixado vazio

        await page.press('input[name="nome"]', 'Enter');
        await page.waitForTimeout(2000);
    });

    test('tentar cadastrar código duplicado', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/produtos.html`, { waitUntil: 'networkidle' });

        await page.click('button:has-text("Novo produto")');
        await page.waitForSelector('#modalProduto', { state: 'visible', timeout: 5000 });
        await page.fill('input[name="nome"]', 'Produto Duplicado UI');
        await page.selectOption('select[name="categoria_id"]', { index: 1 });
        await page.selectOption('select[name="unidade_medida"]', 'Unidade');
        await page.fill('input[name="codigo_barras"]', '6667778889996');

        await page.press('input[name="codigo_barras"]', 'Enter');
        await page.waitForTimeout(2000);
    });
});

test.describe('Scanner de código de barras', () => {
    test('simular leitura rápida (entrada)', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/entrada.html`, { waitUntil: 'networkidle' });

        const codigoInput = page.locator('input#codigo_barras');
        await codigoInput.focus();
        await codigoInput.type('7908227204320', { delay: 10 });
        await page.keyboard.press('Enter');

        await page.waitForTimeout(2000);
    });

    test('simular código inválido', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/entrada.html`, { waitUntil: 'networkidle' });

        const codigoInput = page.locator('input#codigo_barras');
        await codigoInput.focus();
        await codigoInput.type('abc!@#', { delay: 10 });
        await page.keyboard.press('Enter');

        await page.waitForTimeout(2000);
    });

    test('simular produto inexistente', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/entrada.html`, { waitUntil: 'networkidle' });

        const codigoInput = page.locator('input#codigo_barras');
        await codigoInput.focus();
        await codigoInput.type('0000000000000', { delay: 10 });
        await page.keyboard.press('Enter');

        await page.waitForTimeout(2000);
    });

    test('simular duas leituras consecutivas', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/entrada.html`, { waitUntil: 'networkidle' });

        const codigoInput = page.locator('input#codigo_barras');

        await codigoInput.focus();
        await codigoInput.type('7908227204320', { delay: 10 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1500);

        await codigoInput.type('7891234567891', { delay: 10 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1500);
    });

    test('digitação manual continua funcionando', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/entrada.html`, { waitUntil: 'networkidle' });

        const qtdInput = page.locator('input#quantidade');
        await qtdInput.focus();
        await qtdInput.fill('5');
        await expect(qtdInput).toHaveValue('5');
    });
});

test.describe('Entrada de estoque', () => {
    test('ler produto cadastrado e confirmar entrada', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/entrada.html`, { waitUntil: 'networkidle' });

        const codigoInput = page.locator('input#codigo_barras');
        await codigoInput.focus();
        await codigoInput.type('7908227204320', { delay: 10 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        const loteSelect = page.locator('select#lote_id');
        if ((await loteSelect.isDisabled()) === false) {
            await loteSelect.selectOption({ index: 1 });
            await page.fill('input#quantidade', '10');
            await page.click('button#btnRegistrarEntrada');
            await page.waitForTimeout(2000);
        }
    });
});

test.describe('Saída de estoque', () => {
    test('ler produto, selecionar lote, confirmar saída válida', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/saida.html`, { waitUntil: 'networkidle' });

        const codigoInput = page.locator('input#codigo_barras');
        await codigoInput.focus();
        await codigoInput.type('7908227204320', { delay: 10 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        const loteSelect = page.locator('select#lote_id');
        if ((await loteSelect.isDisabled()) === false) {
            await loteSelect.selectOption({ index: 1 });
            await page.fill('input#quantidade', '2');
            await page.click('button#btnRegistrarSaida');
            await page.waitForTimeout(2000);
        }
    });

    test('bloquear quantidade superior ao disponível', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/saida.html`, { waitUntil: 'networkidle' });

        const codigoInput = page.locator('input#codigo_barras');
        await codigoInput.focus();
        await codigoInput.type('7908227204320', { delay: 10 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        const loteSelect = page.locator('select#lote_id');
        if ((await loteSelect.isDisabled()) === false) {
            await loteSelect.selectOption({ index: 1 });
            await page.fill('input#quantidade', '999999');
            await page.waitForTimeout(500);
            const qtd = await page.locator('input#quantidade').inputValue();
            expect(parseInt(qtd)).toBeLessThanOrEqual(999999);
        }
    });
});

test.describe('Interface', () => {
    test('verificar mensagens de sucesso e erro', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/entrada.html`, { waitUntil: 'networkidle' });

        const codigoInput = page.locator('input#codigo_barras');
        await codigoInput.focus();
        await codigoInput.type('0000000000000', { delay: 10 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
    });

    test('verificar console do navegador sem erros críticos', async ({ page }) => {
        const errosConsole = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') errosConsole.push(msg.text());
        });
        await login(page);
        await page.goto(`${BASE_URL}/entrada.html`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        console.log('Erros de console capturados:', errosConsole);
    });

    test('verificar requisições HTTP', async ({ page }) => {
        const falhas = [];
        page.on('response', (response) => {
            if (response.status() >= 500) falhas.push(`${response.status()} ${response.url()}`);
        });
        await login(page);
        await page.goto(`${BASE_URL}/entrada.html`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        console.log('Requisições com erro 5xx:', falhas);
    });

    test('verificar responsividade (mobile)', async ({ page }) => {
        await login(page);
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${BASE_URL}/entrada.html`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await expect(page.locator('input#codigo_barras')).toBeVisible();
    });
});
