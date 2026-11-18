// Categorias JavaScript - CRUD completo

document.addEventListener('DOMContentLoaded', () => {
    carregarCategorias();

    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('formCategoria').addEventListener('submit', salvarCategoria);

    document.getElementById('modalCategoria').addEventListener('hidden.bs.modal', () => {
        document.getElementById('formCategoria').reset();
        document.getElementById('categoriaId').value = '';
        document.getElementById('modalCategoriaLabel').textContent = 'Nova Categoria';
        document.getElementById('btnSalvarCategoria').innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar';
    });
});

async function carregarCategorias() {
    const tbody = document.getElementById('tbodyCategorias');

    try {
        estadoCarregando(tbody, 4);

        const response = await apiFetch('categorias/listar.php');
        const data = await apiJson(response);

        if (!data.sucesso || !data.dados || data.dados.length === 0) {
            estadoVazio(tbody, 4, 'Nenhuma categoria encontrada');
            return;
        }

        tbody.innerHTML = '';
        data.dados.forEach(c => {
            const tr = document.createElement('tr');

            const nomeCelula = document.createElement('td');
            nomeCelula.innerHTML = `<strong>${escapeHtml(c.nome)}</strong>`;

            const statusSpan = document.createElement('span');
            statusSpan.className = `badge ${c.ativo ? 'bg-success' : 'bg-secondary'}`;
            statusSpan.textContent = c.ativo ? 'Ativa' : 'Inativa';

            tr.appendChild(nomeCelula);
            tr.appendChild(montarCelula(c.descricao || '-'));
            tr.appendChild(montarCelula('', 'text-center')).appendChild(statusSpan);

            const tdAcoes = document.createElement('td');
            tdAcoes.className = 'text-end';

            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn btn-sm btn-outline-primary me-1';
            btnEditar.title = 'Editar';
            btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
            btnEditar.addEventListener('click', () => editarCategoria(Number(c.id)));

            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn btn-sm btn-outline-danger';
            btnExcluir.title = 'Excluir';
            btnExcluir.innerHTML = '<i class="bi bi-trash"></i>';
            btnExcluir.addEventListener('click', async () => {
                const confirmado = await confirmar(
                    'Excluir categoria',
                    `Tem certeza que deseja excluir a categoria "${escapeHtml(c.nome)}"?`
                );
                if (confirmado) await excluirCategoria(Number(c.id));
            });

            tdAcoes.appendChild(btnEditar);
            tdAcoes.appendChild(btnExcluir);
            tr.appendChild(tdAcoes);

            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Erro ao carregar categorias:', e);
        estadoErro(tbody, 4, 'Erro ao carregar categorias. Verifique a conexão e tente novamente.', carregarCategorias);
    }
}

function abrirModalNova() {
    document.getElementById('formCategoria').reset();
    document.getElementById('categoriaId').value = '';
    document.getElementById('modalCategoriaLabel').textContent = 'Nova Categoria';
    document.getElementById('btnSalvarCategoria').innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar';
    document.getElementById('ativo').checked = true;
}

async function editarCategoria(id) {
    try {
        const response = await apiFetch('categorias/listar.php');
        const data = await apiJson(response);

        if (!data.sucesso) {
            mostrarToast('Erro ao carregar dados da categoria.', 'danger');
            return;
        }

        const categoria = data.dados.find(c => Number(c.id) === Number(id));
        if (!categoria) {
            mostrarToast('Categoria não encontrada.', 'danger');
            return;
        }

        document.getElementById('categoriaId').value = categoria.id;
        document.getElementById('nome').value = categoria.nome;
        document.getElementById('descricao').value = categoria.descricao || '';
        document.getElementById('ativo').checked = categoria.ativo === 1 || categoria.ativo === true;

        document.getElementById('modalCategoriaLabel').textContent = 'Editar Categoria';
        document.getElementById('btnSalvarCategoria').innerHTML = '<i class="bi bi-check-lg me-1"></i>Atualizar';

        const modal = new bootstrap.Modal(document.getElementById('modalCategoria'));
        modal.show();
    } catch (e) {
        console.error('Erro ao carregar categoria:', e);
        mostrarToast('Erro ao carregar categoria.', 'danger');
    }
}

async function salvarCategoria(e) {
    e.preventDefault();

    const id = document.getElementById('categoriaId').value;
    const isEdit = id !== '';

    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());
    dados.ativo = dados.ativo === 'on' ? 1 : 0;

    const url = isEdit ? 'categorias/editar.php' : 'categorias/cadastrar.php';

    const btn = document.getElementById('btnSalvarCategoria');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

    try {
        const response = await apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const result = await apiJson(response);

        if (result.sucesso) {
            bootstrap.Modal.getInstance(document.getElementById('modalCategoria')).hide();
            carregarCategorias();
            mostrarToast(isEdit ? 'Categoria atualizada com sucesso!' : 'Categoria cadastrada com sucesso!', 'success');
        } else {
            mostrarToast(result.mensagem, 'danger');
        }
    } catch (error) {
        mostrarToast('Erro ao salvar categoria.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function excluirCategoria(id) {
    try {
        const response = await apiFetch('categorias/excluir.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        const result = await apiJson(response);

        if (result.sucesso) {
            carregarCategorias();
            mostrarToast(result.mensagem || 'Categoria excluída com sucesso!', 'success');
        } else {
            mostrarToast(result.mensagem, 'danger');
        }
    } catch (error) {
        mostrarToast('Erro ao excluir categoria.', 'danger');
    }
}

async function logout() {
    await window.logout();
}


