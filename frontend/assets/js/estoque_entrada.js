// Entrada de Estoque JavaScript - Integração completa com scanner de código de barras

let produtosCache = [];
let scanner = null;
let feedback = null;
let requisicaoScanAtiva = false;
let ultimoResultadoScan = null;

/**
 * Registra uma leitura do scanner no histórico separado de movimentações.
 * @param {Object} dados { codigo_lido, produto_id, resultado, tela_origem }
 */
async function registrarLeituraScanner(dados) {
    try {
        await apiFetch('registro/registrar_leitura.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
    } catch (e) {
        // Não bloquear o fluxo da tela se falhar o registro de histórico
        console.warn('Falha ao registrar leitura no histórico:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    inicializarLeitorCodigoBarras();
    inicializarFeedbackScanner();

    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('formEntrada').addEventListener('submit', registrarEntrada);
    document.getElementById('btnLimparForm').addEventListener('click', limparFormulario);
    document.getElementById('btnBuscarPorCodigo').addEventListener('click', buscarProdutoPorCodigoManual);
    document.getElementById('produto_id').addEventListener('change', carregarLotesDoProduto);
    document.getElementById('quantidade').addEventListener('input', validarQuantidadeEntrada);

    // Novo lote: permitir cadastrar lote diretamente na tela de entrada
    document.getElementById('btnNovoLote').addEventListener('click', abrirModalNovoLote);
    document.getElementById('formNovoLote').addEventListener('submit', cadastrarNovoLote);
});

/* ========================================================================
   INICIALIZAÇÃO DO SCANNER E FEEDBACK
   ======================================================================== */

/**
 * Inicializa o leitor de código de barras USB (ScanToInput) com feedback
 * visual e sonoro, controle de requisições simultâneas e anti-duplicata.
 */
function inicializarLeitorCodigoBarras() {
    feedback = new ScannerFeedback();
    scanner = new ScanToInput({
        scanThreshold: 50,
        minLength: 4,
        inputSelector: '[data-scan-box]',
        mode: 'overwrite',
        // Valida códigos de barras (EAN-8, EAN-13, UPC-A, Code 128, ITF-14)
        validation: (code) => CodigoBarrasValidacao.aceitar(code),
        duplicateTimeout: 1500,
        busyTimeout: 3000,
        onEstado: (estado) => {
            switch (estado) {
                case 'aguardando': feedback.aguardando(); break;
                case 'processando': feedback.processando(); break;
                case 'identificado': feedback.marcarIdentificado(); break;
                case 'erro': feedback.marcarErro(); break;
            }
        },
        onScan: (code, input) => {
            // Marcar campo visualmente
            input?.classList.add('is-valid');
            processarLeituraScanner(code);
        }
    });
}

/**
 * Inicializa o feedback visual e sonoro do scanner.
 */
function inicializarFeedbackScanner() {
    feedback = feedback || new ScannerFeedback();
    feedback.aguardando();
}

/* ========================================================================
   PROCESSAMENTO DE LEITURA DO SCANNER
   ======================================================================== */

/**
 * Processa um código lido pelo scanner: valida, busca o produto e exibe feedback.
 * Não registra entrada automaticamente — exige confirmação do usuário.
 */
async function processarLeituraScanner(codigo) {
    if (requisicaoScanAtiva) return;
    requisicaoScanAtiva = true;

    try {
        // Validar formato do código
        const validacao = CodigoBarrasValidacao.validar(codigo);
        if (!validacao.valido) {
            feedback.codigoInvalido(codigo);
            document.getElementById('codigo_barras').classList.remove('is-valid');
            document.getElementById('codigo_barras').classList.add('is-invalid');
            mostrarToast('Código de barras inválido: ' + validacao.motivo, 'warning');
            await registrarLeituraScanner({
                codigo_lido: codigo,
                produto_id: null,
                resultado: 'invalido',
                tela_origem: 'entrada'
            });
            return;
        }

        // Buscar produto pelo código
        await buscarProdutoPorCodigo(codigo, true);
    } catch (e) {
        console.error('Erro ao processar leitura do scanner:', e);
        feedback.erroComunicacao();
        mostrarToast('Erro de comunicação com o servidor.', 'danger');
        await registrarLeituraScanner({
            codigo_lido: codigo,
            produto_id: null,
            resultado: 'erro_comunicacao',
            tela_origem: 'entrada'
        });
    } finally {
        requisicaoScanAtiva = false;
    }
}

/**
 * Busca produto pelo código de barras (digitado manualmente ou escaneado).
 * @param {string|null} codigo - Código de barras (se null, lê do input)
 * @param {boolean} doScan - Indica se a origem foi o scanner
 */
async function buscarProdutoPorCodigo(codigo = null, doScan = false) {
    const codigoInput = document.getElementById('codigo_barras');
    const code = codigo || codigoInput.value.trim();

    if (!code) {
        if (doScan) feedback.produtoNaoEncontrado(code);
        mostrarToast('Informe ou escaneie um código de barras.', 'warning');
        return;
    }

    // Validar formato
    const validacao = CodigoBarrasValidacao.validar(code);
    if (!validacao.valido) {
        feedback.codigoInvalido(code);
        codigoInput.classList.remove('is-valid');
        codigoInput.classList.add('is-invalid');
        mostrarToast('Código de barras inválido: ' + validacao.motivo, 'warning');
        return;
    }

    try {
        const response = await apiFetch(`produtos/buscar_por_codigo.php?codigo_barras=${encodeURIComponent(code)}`);
        const data = await apiJson(response);

        if (!data.sucesso) {
            // Diferenciar erro de comunicação de "não encontrado"
            if (response.status === 404) {
                feedback.produtoNaoEncontrado(code);
                mostrarToast(data.mensagem || 'Código não encontrado.', 'warning');
                await registrarLeituraScanner({
                    codigo_lido: code,
                    produto_id: null,
                    resultado: 'nao_encontrado',
                    tela_origem: 'entrada'
                });
            } else {
                feedback.erroComunicacao();
                mostrarToast('Erro ao buscar produto. Verifique a conexão.', 'danger');
                await registrarLeituraScanner({
                    codigo_lido: code,
                    produto_id: null,
                    resultado: 'erro_comunicacao',
                    tela_origem: 'entrada'
                });
            }
            codigoInput.classList.remove('is-valid');
            codigoInput.classList.add('is-invalid');
            return;
        }

        const tipo = data.tipo;
        const dados = data.dados;

        // Resetar campos derivados
        document.getElementById('quantidade_disponivel').value = '';
        document.getElementById('validade_lote').value = '';
        document.getElementById('lote_id').disabled = true;
        document.getElementById('lote_id').innerHTML = '<option value="">Selecione um produto primeiro</option>';

        if (tipo === 'lote') {
            // Código interno de lote: localizar diretamente o lote
            const lote = dados.lote;
            const produto = dados.produto;

            await selecionarProduto(produto.id, produto.nome, produto.unidade_medida);

            // Após carregar os lotes, selecionar o lote escaneado
            setTimeout(() => {
                const loteSelect = document.getElementById('lote_id');
                const option = Array.from(loteSelect.options).find(o => o.value == lote.id);
                if (option) {
                    loteSelect.value = lote.id;
                    loteSelect.dispatchEvent(new Event('change'));
                }
            }, 300);

            feedback.produtoEncontrado({
                nome: produto.nome,
                codigo_barras: lote.codigo_barras_interno || code,
                estoque: lote.quantidade,
                tipo: 'lote'
            });
            mostrarToast(`Código interno do lote: ${lote.codigo_barras_interno}. Lote "${lote.numero_lote}" selecionado.`, 'info');

        } else {
            // Código do fornecedor ou do produto: selecionar automaticamente o primeiro lote com estoque
            const produto = dados.produto;
            await selecionarProduto(produto.id, produto.nome, produto.unidade_medida);

            // Carregar lotes do produto e selecionar o primeiro com estoque > 0
            const responseLotes = await apiFetch(`lotes/listar.php?produto_id=${produto.id}`);
            const dataLotes = await apiJson(responseLotes);

            if (dataLotes.sucesso && dataLotes.dados && dataLotes.dados.length > 0) {
                const lotesComEstoque = dataLotes.dados.filter(l => (parseInt(l.quantidade) || 0) > 0);
                if (lotesComEstoque.length > 0) {
                    const lote = lotesComEstoque[0];
                    const loteSelect = document.getElementById('lote_id');
                    loteSelect.disabled = false;
                    loteSelect.innerHTML = '<option value="">Selecione um lote</option>' +
                        dataLotes.dados.map(l => {
                            const vencido = new Date(l.data_validade || '9999-12-31') < new Date();
                            const classe = vencido ? 'text-danger' : '';
                            return `<option value="${escapeHtml(l.id)}" data-qtd="${escapeHtml(l.quantidade)}" data-val="${escapeHtml(l.data_validade)}" class="${classe}">
                                ${escapeHtml(l.numero_lote)} (Qtd: ${escapeHtml(l.quantidade)})${l.data_validade ? ' - Val: ' + escapeHtml(l.data_validade) : ''}
                            </option>`;
                        }).join('');
                    loteSelect.value = lote.id;
                    loteSelect.dispatchEvent(new Event('change'));
                }
            }

            const origem = tipo === 'fornecedor' ? ' (código do fornecedor)' : '';
            feedback.produtoEncontrado({
                nome: produto.nome,
                codigo_barras: code,
                estoque: dados.lotes ? dados.lotes.reduce((s, l) => s + (parseInt(l.quantidade) || 0), 0) : 0,
                tipo
            });
            mostrarToast(`Produto encontrado: ${produto.nome}${origem}. Lote selecionado automaticamente. Informe a quantidade.`, 'info');
        }

        codigoInput.classList.remove('is-invalid');
        codigoInput.classList.add('is-valid');

        // Registrar leitura bem-sucedida no histórico
        let produtoIdResultado = null;
        if (tipo === 'lote') {
            produtoIdResultado = dados.produto.id;
        } else {
            produtoIdResultado = dados.produto.id;
        }
        await registrarLeituraScanner({
            codigo_lido: code,
            produto_id: produtoIdResultado,
            resultado: 'sucesso',
            tela_origem: 'entrada'
        });

        ultimoResultadoScan = { codigo, tipo, dados };

    } catch (e) {
        console.error('Erro ao buscar produto por código:', e);
        feedback.erroComunicacao();
        mostrarToast('Erro ao buscar produto.', 'danger');
        document.getElementById('codigo_barras').classList.add('is-invalid');
        await registrarLeituraScanner({
            codigo_lido: code,
            produto_id: null,
            resultado: 'erro_comunicacao',
            tela_origem: 'entrada'
        });
    }
}

/**
 * Busca acionada por clique manual no botão "Buscar por Código".
 */
async function buscarProdutoPorCodigoManual() {
    await buscarProdutoPorCodigo(null, false);
}

/**
 * Seleciona um produto no select e carrega seus lotes.
 */
async function selecionarProduto(produtoId, nome, unidadeMedida) {
    const produtoSelect = document.getElementById('produto_id');
    produtoSelect.innerHTML = `
        <option value="${produtoId}" selected>${escapeHtml(nome)} (${escapeHtml(unidadeMedida)})</option>
    `;
    produtoSelect.dispatchEvent(new Event('change'));
}

/* ========================================================================
   CARREGAMENTO DE PRODUTOS E LOTES
   ======================================================================== */

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

    if (!produto_id) {
        loteSelect.innerHTML = '<option value="">Selecione um produto primeiro</option>';
        return;
    }

    try {
        const response = await apiFetch(`lotes/listar.php?produto_id=${produto_id}`);
        const data = await apiJson(response);

        if (data.sucesso && data.dados && data.dados.length > 0) {
            // Ordenar por validade (FEFO - First Expire, First Out)
            const lotesOrdenados = [...data.dados].sort((a, b) => {
                const da = new Date(a.data_validade || '9999-12-31');
                const db = new Date(b.data_validade || '9999-12-31');
                return da - db;
            });

            loteSelect.innerHTML = '<option value="">Selecione um lote</option>' +
                lotesOrdenados.map(l => {
                    const vencido = new Date(l.data_validade) < new Date();
                    const classe = vencido ? 'text-danger' : '';
                    return `<option value="${escapeHtml(l.id)}" data-qtd="${escapeHtml(l.quantidade)}" data-val="${escapeHtml(l.data_validade)}" class="${classe}">
                        ${escapeHtml(l.numero_lote)} (Qtd: ${escapeHtml(l.quantidade)})${l.data_validade ? ' - Val: ' + escapeHtml(l.data_validade) : ''}
                    </option>`;
                }).join('');
            loteSelect.disabled = false;
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
    document.getElementById('validade_lote').value = val ? formatarDataEntrada(val) : '';
});

/* ========================================================================
   NOVO LOTE (cadastro direto na tela de entrada)
   ======================================================================== */

function abrirModalNovoLote() {
    const produto_id = document.getElementById('produto_id').value;
    if (!produto_id) {
        mostrarToast('Selecione um produto antes de cadastrar um lote.', 'warning');
        return;
    }
    document.getElementById('novo_lote_produto_id').value = produto_id;
    document.getElementById('formNovoLote').reset();
    const modal = new bootstrap.Modal(document.getElementById('modalNovoLote'));
    modal.show();
}

async function cadastrarNovoLote(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());
    dados.produto_id = parseInt(dados.produto_id);
    dados.quantidade = parseInt(dados.quantidade);

    const btn = document.getElementById('btnSalvarNovoLote');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

    try {
        const response = await apiFetch('lotes/cadastrar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        const result = await apiJson(response);

        if (result.sucesso) {
            bootstrap.Modal.getInstance(document.getElementById('modalNovoLote')).hide();
            mostrarToast('Lote cadastrado com sucesso!', 'success');
            await carregarLotesDoProduto();
            // Selecionar o lote recém-criado
            setTimeout(() => {
                if (result.dados && result.dados.lote_id) {
                    const loteSelect = document.getElementById('lote_id');
                    const option = Array.from(loteSelect.options).find(o => o.value == result.dados.lote_id);
                    if (option) {
                        loteSelect.value = result.dados.lote_id;
                        loteSelect.dispatchEvent(new Event('change'));
                    }
                }
            }, 400);
        } else {
            mostrarToast(result.mensagem, 'danger');
        }
    } catch (error) {
        mostrarToast('Erro ao cadastrar lote.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/* ========================================================================
   VALIDAÇÃO E REGISTRO DE ENTRADA
   ======================================================================== */

function validarQuantidadeEntrada() {
    const qtdInput = document.getElementById('quantidade');
    const max = parseInt(qtdInput.max) || 0;
    const val = parseInt(qtdInput.value) || 0;
    if (max > 0 && val > max) {
        qtdInput.value = max;
        mostrarToast(`Quantidade máxima disponível: ${max}`, 'warning');
    }
}

async function registrarEntrada(e) {
    e.preventDefault();

    const produto_id = document.getElementById('produto_id').value;
    const lote_id = document.getElementById('lote_id').value;
    const quantidade = document.getElementById('quantidade').value;
    const observacao = document.getElementById('observacao').value.trim();

    if (!produto_id || !lote_id || !quantidade || parseInt(quantidade) <= 0) {
        mostrarToast('Informe produto, lote e quantidade válidos.', 'warning');
        return;
    }

    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());
    dados.produto_id = parseInt(dados.produto_id);
    dados.lote_id = parseInt(dados.lote_id);
    dados.quantidade = parseInt(dados.quantidade);

    const btn = document.getElementById('btnRegistrarEntrada');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Registrando...';

    try {
        const response = await apiFetch('estoque/entrada.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const result = await apiJson(response);

        if (response._sessaoExpirada) {
            mostrarToast(result.mensagem || 'Sessão expirada. Faça login novamente.', 'warning');
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
            return;
        }

        if (result.sucesso) {
            mostrarToast('Entrada registrada com sucesso!', 'success');
            limparFormulario();
        } else {
            mostrarToast(result.mensagem, 'danger');
        }
    } catch (error) {
        mostrarToast('Erro ao registrar entrada.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function limparFormulario() {
    document.getElementById('formEntrada').reset();
    document.getElementById('codigo_barras').value = '';
    document.getElementById('codigo_barras').classList.remove('is-valid', 'is-invalid');
    document.getElementById('lote_id').disabled = true;
    document.getElementById('lote_id').innerHTML = '<option value="">Selecione um produto primeiro</option>';
    document.getElementById('quantidade_disponivel').value = '';
    document.getElementById('validade_lote').value = '';
    document.getElementById('quantidade').removeAttribute('max');
    ultimoResultadoScan = null;
    feedback.aguardando();
}

async function logout() {
    await window.logout();
}

function formatarDataEntrada(dataString) {
    return window.formatarDataCurta(dataString);
}
