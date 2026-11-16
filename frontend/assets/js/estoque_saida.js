// Saída de Estoque JavaScript

let produtosCache = [];
let scanner = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    inicializarLeitorCodigoBarras();

    document.getElementById('btnLogout').addEventListener('click', logout);
    document.getElementById('formSaida').addEventListener('submit', registrarSaida);
    document.getElementById('btnLimparForm').addEventListener('click', () => {
        document.getElementById('formSaida').reset();
        document.getElementById('lote_id').disabled = true;
        document.getElementById('lote_id').innerHTML = '<option value="">Selecione um produto primeiro</option>';
        document.getElementById('quantidade_disponivel').value = '';
        document.getElementById('validade_lote').value = '';
        document.getElementById('quantidade').removeAttribute('max');
    });

    document.getElementById('btnBuscarPorCodigo').addEventListener('click', buscarProdutoPorCodigo);
});

/**
 * Inicializa o leitor de código de barras USB (ScanToInput)
 */
function inicializarLeitorCodigoBarras() {
    scanner = new ScanToInput({
        scanThreshold: 50,
        minLength: 6,
        inputSelector: '[data-scan-box]',
        mode: 'overwrite',
        // Aceita códigos numéricos (fornecedor/produto) e alfanuméricos (código interno do lote, ex: AG00000001)
        validation: (code) => /^[A-Za-z0-9]{6,20}$/.test(code),
        onScan: (code, input) => {
            input?.classList.add('is-valid');
            buscarProdutoPorCodigo(code);
        }
    });
}

/**
 * Busca produto pelo código de barras digitado ou escaneado
 * @param {string|null} codigo - Código de barras (se null, lê do input)
 */
async function buscarProdutoPorCodigo(codigo = null) {
    const codigoInput = document.getElementById('codigo_barras');
    const code = codigo || codigoInput.value.trim();

    if (!code) {
        mostrarToast('Informe ou escaneie um código de barras.', 'warning');
        return;
    }

    if (!/^[A-Za-z0-9]{6,20}$/.test(code)) {
        mostrarToast('Código de barras inválido. Use 6 a 20 caracteres alfanuméricos.', 'danger');
        return;
    }

    try {
        const response = await apiFetch(`produtos/buscar_por_codigo.php?codigo_barras=${encodeURIComponent(code)}`);
        const data = await apiJson(response);

        if (!data.sucesso) {
            mostrarToast(data.mensagem || 'Código não encontrado.', 'danger');
            codigoInput.classList.remove('is-valid');
            codigoInput.classList.add('is-invalid');
            return;
        }

        const tipo = data.tipo;
        const dados = data.dados;

        // Resetar campos derivados
        document.getElementById('quantidade_disponivel').value = '';
        document.getElementById('validade_lote').value = '';
        document.getElementById('quantidade').removeAttribute('max');
        document.getElementById('lote_id').disabled = true;
        document.getElementById('lote_id').innerHTML = '<option value="">Selecione um produto primeiro</option>';

        if (tipo === 'lote') {
            // Código interno de lote: localizar diretamente o lote
            const lote = dados.lote;
            const produto = dados.produto;

            const produtoSelect = document.getElementById('produto_id');
            produtoSelect.innerHTML = `
                <option value="${produto.id}" selected>${escapeHtml(produto.nome)} (${escapeHtml(produto.unidade_medida)})</option>
            `;
            produtoSelect.dispatchEvent(new Event('change'));

            // Após carregar os lotes do produto (assíncrono), selecionar o lote escaneado
            const tentativas = setTimeout(() => {
                const loteSelect = document.getElementById('lote_id');
                const option = Array.from(loteSelect.options).find(o => o.value == lote.id);
                if (option) {
                    loteSelect.value = lote.id;
                    loteSelect.dispatchEvent(new Event('change'));
                }
            }, 300);

            document.getElementById('lote_id').addEventListener('change', () => clearTimeout(tentativas), { once: true });

            mostrarToast(`Código interno do lote: ${escapeHtml(lote.codigo_barras_interno)}. Lote "${escapeHtml(lote.numero_lote)}" selecionado.`, 'info');
        } else {
            // Código do fornecedor ou do produto: localizar o produto, usuário escolhe o lote
            const produto = dados.produto;
            const produtoSelect = document.getElementById('produto_id');
            produtoSelect.innerHTML = `
                <option value="${produto.id}" selected>${escapeHtml(produto.nome)} (${escapeHtml(produto.unidade_medida)})</option>
            `;
            produtoSelect.dispatchEvent(new Event('change'));

            const origem = tipo === 'fornecedor' ? ' (código do fornecedor)' : '';
            mostrarToast(`Produto encontrado: ${escapeHtml(produto.nome)}${origem}. Selecione o lote e informe a quantidade.`, 'info');
        }

        codigoInput.classList.remove('is-invalid');
        codigoInput.classList.add('is-valid');

    } catch (e) {
        console.error('Erro ao buscar produto por código:', e);
        mostrarToast('Erro ao buscar produto.', 'danger');
        document.getElementById('codigo_barras').classList.add('is-invalid');
    }
}

async function carregarProdutos() {
    try {
        const response = await apiFetch('produtos/listar.php?ativo=1');
        const data = await apiJson(response);
        if (data.sucesso) {
            produtosCache = data.dados;
            const select = document.getElementById('produto_id');
            select.innerHTML = '<option value="">Selecione um produto</option>' +
                produtosCache.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nome)} (${escapeHtml(p.unidade_medida)})</option>`).join('');
        }
    } catch (e) {
        console.error('Erro ao carregar produtos:', e);
        mostrarToast('Erro ao carregar produtos.', 'danger');
    }
}

async function carregarLotesDoProduto() {
    const produto_id = document.getElementById('produto_id').value;
    const loteSelect = document.getElementById('lote_id');
    const qtdDisponivel = document.getElementById('quantidade_disponivel');
    const validadeLote = document.getElementById('validade_lote');

    loteSelect.disabled = true;
    loteSelect.innerHTML = '<option value="">Carregando...</option>';
    qtdDisponivel.value = '';
    validadeLote.value = '';
    document.getElementById('quantidade').removeAttribute('max');

    if (!produto_id) {
        loteSelect.innerHTML = '<option value="">Selecione um produto primeiro</option>';
        return;
    }

    try {
        const response = await apiFetch(`lotes/listar.php?produto_id=${produto_id}`);
        const data = await apiJson(response);

        if (data.sucesso && data.dados && data.dados.length > 0) {
            // Filtrar apenas lotes com quantidade > 0
            const lotesComEstoque = data.dados.filter(l => l.quantidade > 0);

            if (lotesComEstoque.length > 0) {
                loteSelect.innerHTML = '<option value="">Selecione um lote</option>' +
                    lotesComEstoque.map(l => `<option value="${escapeHtml(l.id)}" data-qtd="${escapeHtml(l.quantidade)}" data-val="${escapeHtml(l.data_validade)}">${escapeHtml(l.numero_lote)} (Qtd: ${escapeHtml(l.quantidade)})</option>`).join('');
                loteSelect.disabled = false;
            } else {
                loteSelect.innerHTML = '<option value="">Nenhum lote com estoque disponível</option>';
            }
        } else {
            loteSelect.innerHTML = '<option value="">Nenhum lote cadastrado para este produto</option>';
        }
    } catch (e) {
        console.error('Erro ao carregar lotes:', e);
        loteSelect.innerHTML = '<option value="">Erro ao carregar lotes</option>';
    }
}

document.getElementById('lote_id').addEventListener('change', function () {
    const option = this.options[this.selectedIndex];
    const qtd = option.dataset.qtd;
    const val = option.dataset.val;

    document.getElementById('quantidade_disponivel').value = qtd ? `${qtd} unidades` : '';
    document.getElementById('validade_lote').value = val ? formatarData(val) : '';

    // Validar quantidade máxima
    const qtdInput = document.getElementById('quantidade');
    if (qtd) {
        qtdInput.max = qtd;
    }
});

document.getElementById('quantidade').addEventListener('input', function () {
    const max = parseInt(this.max) || 999999;
    const val = parseInt(this.value) || 0;
    if (val > max) {
        this.value = max;
        mostrarToast(`Quantidade máxima disponível: ${max}`, 'warning');
    }
});

async function registrarSaida(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());
    dados.produto_id = parseInt(dados.produto_id);
    dados.lote_id = parseInt(dados.lote_id);
    dados.quantidade = parseInt(dados.quantidade);

    const btn = document.getElementById('btnRegistrarSaida');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Registrando...';

    try {
        const response = await apiFetch('estoque/saida.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const result = await apiJson(response);

        if (result.sucesso) {
            mostrarToast('Saída registrada com sucesso!', 'success');
            e.target.reset();
            document.getElementById('lote_id').disabled = true;
            document.getElementById('lote_id').innerHTML = '<option value="">Selecione um produto primeiro</option>';
            document.getElementById('quantidade_disponivel').value = '';
            document.getElementById('validade_lote').value = '';
            document.getElementById('quantidade').removeAttribute('max');
        } else {
            mostrarToast(result.mensagem, 'danger');
        }
    } catch (error) {
        mostrarToast('Erro ao registrar saída.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function logout() {
    await window.logout();
}

function formatarData(dataString) {
    return window.formatarDataCurta(dataString);
}
