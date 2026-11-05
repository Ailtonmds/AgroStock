// Saída de Estoque JavaScript

let produtosCache = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();

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
});

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
