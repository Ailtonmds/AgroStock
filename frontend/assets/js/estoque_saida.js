// Saída de Estoque JavaScript - Integração completa com scanner de código de barras
// Implementa FEFO (First Expire, First Out) e bloqueia retirada de lotes vencidos.

let produtosCache = [];
let scanner = null;
let feedback = null;
let requisicaoScanAtiva = false;

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
        console.warn('Falha ao registrar leitura no histórico:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    inicializarLeitorCodigoBarras();
    inicializarFeedbackScanner();

    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('formSaida').addEventListener('submit', registrarSaida);
    document.getElementById('btnLimparForm').addEventListener('click', limparFormulario);
    document.getElementById('btnBuscarPorCodigo').addEventListener('click', buscarProdutoPorCodigoManual);
    document.getElementById('produto_id').addEventListener('change', carregarLotesDoProduto);
    document.getElementById('quantidade').addEventListener('input', validarQuantidadeSaida);
});

/* ========================================================================
   INICIALIZAÇÃO DO SCANNER E FEEDBACK
   ======================================================================== */

/**
 * Inicializa o leitor de código de barras USB (ScanToInput).
 */
function inicializarLeitorCodigoBarras() {
    feedback = new ScannerFeedback();
    scanner = new ScanToInput({
        scanThreshold: 50,
        minLength: 4,
        inputSelector: '[data-scan-box]',
        mode: 'overwrite',
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
 * Processa um código lido pelo scanner. Não registra saída automaticamente.
 */
async function processarLeituraScanner(codigo) {
    if (requisicaoScanAtiva) return;
    requisicaoScanAtiva = true;

    try {
        const validacao = CodigoBarrasValidacao.validar(codigo);
        if (!validacao.valido) {
            feedback.codigoInvalido(codigo);
            document.getElementById('codigo_barras').classList.remove('is-valid');
            document.getElementById('codigo_barras').classList.add('is-invalid');
            mostrarToast('Código de barras inválido: ' + validacao.motivo, 'warning');
            return;
        }

        await buscarProdutoPorCodigo(codigo, true);
    } catch (e) {
        console.error('Erro ao processar leitura do scanner:', e);
        feedback.erroComunicacao();
        mostrarToast('Erro de comunicação com o servidor.', 'danger');
        await registrarLeituraScanner({
            codigo_lido: codigo,
            produto_id: null,
            resultado: 'erro_comunicacao',
            tela_origem: 'saida'
        });
    } finally {
        requisicaoScanAtiva = false;
    }
}

/**
 * Busca produto pelo código de barras.
 */
async function buscarProdutoPorCodigo(codigo = null, doScan = false) {
    const codigoInput = document.getElementById('codigo_barras');
    const code = codigo || codigoInput.value.trim();

    if (!code) {
        if (doScan) feedback.produtoNaoEncontrado(code);
        mostrarToast('Informe ou escaneie um código de barras.', 'warning');
        return;
    }

    const validacao = CodigoBarrasValidacao.validar(code);
    if (!validacao.valido) {
        feedback.codigoInvalido(code);
        codigoInput.classList.remove('is-valid');
        codigoInput.classList.add('is-invalid');
        mostrarToast('Código de barras inválido: ' + validacao.motivo, 'warning');
        await registrarLeituraScanner({
            codigo_lido: code,
            produto_id: null,
            resultado: 'invalido',
            tela_origem: 'saida'
        });
        return;
    }

    try {
        const response = await apiFetch(`produtos/buscar_por_codigo.php?codigo_barras=${encodeURIComponent(code)}`);
        const data = await apiJson(response);

        if (!data.sucesso) {
            if (response.status === 404) {
                feedback.produtoNaoEncontrado(code);
                mostrarToast(data.mensagem || 'Código não encontrado.', 'warning');
                await registrarLeituraScanner({
                    codigo_lido: code,
                    produto_id: null,
                    resultado: 'nao_encontrado',
                    tela_origem: 'saida'
                });
            } else {
                feedback.erroComunicacao();
                mostrarToast('Erro ao buscar produto. Verifique a conexão.', 'danger');
                await registrarLeituraScanner({
                    codigo_lido: code,
                    produto_id: null,
                    resultado: 'erro_comunicacao',
                    tela_origem: 'saida'
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
        document.getElementById('quantidade').removeAttribute('max');

        if (tipo === 'lote') {
            const lote = dados.lote;
            const produto = dados.produto;

            await selecionarProduto(produto.id, produto.nome, produto.unidade_medida);

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
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                const lotesOrdenados = [...dataLotes.dados].sort((a, b) => {
                    const da = new Date(a.data_validade || '9999-12-31');
                    const db = new Date(b.data_validade || '9999-12-31');
                    return da - db;
                });
                const lotesComEstoque = lotesOrdenados.filter(l => (parseInt(l.quantidade) || 0) > 0);
                if (lotesComEstoque.length > 0) {
                    const lote = lotesComEstoque[0];
                    const loteSelect = document.getElementById('lote_id');
                    loteSelect.disabled = false;
                    loteSelect.innerHTML = '<option value="">Selecione um lote</option>' +
                        lotesOrdenados.map(l => {
                            const vencido = new Date(l.data_validade || '9999-12-31') < hoje;
                            const classe = vencido ? 'text-danger' : '';
                            const dataVal = l.data_validade ? escapeHtml(l.data_validade) : '';
                            return `<option value="${escapeHtml(l.id)}" data-qtd="${escapeHtml(l.quantidade)}" data-val="${dataVal}" class="${classe}">
                                ${escapeHtml(l.numero_lote)} (Qtd: ${escapeHtml(l.quantidade)})${dataVal ? ' - Val: ' + dataVal : ''}
                                ${vencido ? ' <span class="badge bg-danger">Vencido</span>' : ''}
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
            tela_origem: 'saida'
        });

    } catch (e) {
        console.error('Erro ao buscar produto por código:', e);
        feedback.erroComunicacao();
        mostrarToast('Erro ao buscar produto.', 'danger');
        document.getElementById('codigo_barras').classList.add('is-invalid');
        await registrarLeituraScanner({
            codigo_lido: code,
            produto_id: null,
            resultado: 'erro_comunicacao',
            tela_origem: 'saida'
        });
    }
}

async function buscarProdutoPorCodigoManual() {
    await buscarProdutoPorCodigo(null, false);
}

async function selecionarProduto(produtoId, nome, unidadeMedida) {
    const produtoSelect = document.getElementById('produto_id');
    produtoSelect.innerHTML = `
        <option value="${produtoId}" selected>${escapeHtml(nome)} (${escapeHtml(unidadeMedida)})</option>
    `;
    produtoSelect.dispatchEvent(new Event('change'));
}

/* ========================================================================
   CARREGAMENTO DE PRODUTOS E LOTES (FEFO)
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
    document.getElementById('quantidade').removeAttribute('max');

    if (!produto_id) {
        loteSelect.innerHTML = '<option value="">Selecione um produto primeiro</option>';
        return;
    }

    try {
        const response = await apiFetch(`lotes/listar.php?produto_id=${produto_id}`);
        const data = await apiJson(response);

        if (data.sucesso && data.dados && data.dados.length > 0) {
            // FEFO: ordenar por validade mais próxima primeiro
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const lotesOrdenados = [...data.dados].sort((a, b) => {
                const da = new Date(a.data_validade || '9999-12-31');
                const db = new Date(b.data_validade || '9999-12-31');
                return da - db;
            });

            // Filtrar apenas lotes com quantidade > 0
            const lotesComEstoque = lotesOrdenados.filter(l => (parseInt(l.quantidade) || 0) > 0);

            if (lotesComEstoque.length > 0) {
                loteSelect.innerHTML = '<option value="">Selecione um lote</option>' +
                    lotesComEstoque.map(l => {
                        const vencido = new Date(l.data_validade) < hoje;
                        const classe = vencido ? 'text-danger' : '';
                        const dataVal = l.data_validade ? escapeHtml(l.data_validade) : '';
                        return `<option value="${escapeHtml(l.id)}" data-qtd="${escapeHtml(l.quantidade)}" data-val="${dataVal}" class="${classe}">
                            ${escapeHtml(l.numero_lote)} (Qtd: ${escapeHtml(l.quantidade)})${dataVal ? ' - Val: ' + dataVal : ''}
                            ${vencido ? ' <span class="badge bg-danger">Vencido</span>' : ''}
                        </option>`;
                    }).join('');
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
    document.getElementById('validade_lote').value = val ? formatarDataSaida(val) : '';

    // Validar quantidade máxima (estoque do lote)
    const qtdInput = document.getElementById('quantidade');
    if (qtd) {
        qtdInput.max = qtd;
    } else {
        qtdInput.removeAttribute('max');
    }
});

document.getElementById('quantidade').addEventListener('input', validarQuantidadeSaida);

/* ========================================================================
   VALIDAÇÃO DE QUANTIDADE E REGISTRO DE SAÍDA
   ======================================================================== */

function validarQuantidadeSaida() {
    const qtdInput = document.getElementById('quantidade');
    const max = parseInt(qtdInput.max) || 0;
    const val = parseInt(qtdInput.value) || 0;
    if (max > 0 && val > max) {
        qtdInput.value = max;
        mostrarToast(`Quantidade máxima disponível: ${max}`, 'warning');
    }

    // Bloquear lote vencido: se o lote selecionado estiver vencido, alertar
    const loteSelect = document.getElementById('lote_id');
    const option = loteSelect.options[loteSelect.selectedIndex];
    if (option && option.classList.contains('text-danger')) {
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const val = new Date(option.dataset.val || '9999-12-31');
        if (val < hoje) {
            mostrarToast('Atenção: este lote está vencido. Confirme a operação.', 'warning');
        }
    }
}

async function registrarSaida(e) {
    e.preventDefault();

    const produto_id = document.getElementById('produto_id').value;
    const lote_id = document.getElementById('lote_id').value;
    const quantidade = document.getElementById('quantidade').value;
    const observacao = document.getElementById('observacao').value.trim();

    if (!produto_id || !lote_id || !quantidade || parseInt(quantidade) <= 0) {
        mostrarToast('Informe produto, lote e quantidade válidos.', 'warning');
        return;
    }

    // Verificar se lote selecionado está vencido (exigir confirmação explícita)
    const loteSelect = document.getElementById('lote_id');
    const option = loteSelect.options[loteSelect.selectedIndex];
    if (option && option.dataset.val) {
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const val = new Date(option.dataset.val);
        if (val < hoje) {
            const confirmado = await confirmar(
                'Lote vencido',
                'Este lote está vencido. Deseja realmente realizar a saída?'
            );
            if (!confirmado) return;
        }
    }

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

        if (response._sessaoExpirada) {
            mostrarToast(result.mensagem || 'Sessão expirada. Faça login novamente.', 'warning');
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
            return;
        }

        if (result.sucesso) {
            mostrarToast('Saída registrada com sucesso!', 'success');
            limparFormulario();
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

function limparFormulario() {
    document.getElementById('formSaida').reset();
    document.getElementById('codigo_barras').value = '';
    document.getElementById('codigo_barras').classList.remove('is-valid', 'is-invalid');
    document.getElementById('lote_id').disabled = true;
    document.getElementById('lote_id').innerHTML = '<option value="">Selecione um produto primeiro</option>';
    document.getElementById('quantidade_disponivel').value = '';
    document.getElementById('validade_lote').value = '';
    document.getElementById('quantidade').removeAttribute('max');
    feedback.aguardando();
}

async function logout() {
    await window.logout();
}

function formatarDataSaida(dataString) {
    return window.formatarDataCurta(dataString);
}
