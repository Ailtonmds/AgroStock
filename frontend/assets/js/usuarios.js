// Usuários JavaScript - CRUD completo

document.addEventListener('DOMContentLoaded', () => {
    carregarUsuarios();

    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('formUsuario').addEventListener('submit', salvarUsuario);

    document.getElementById('modalUsuario').addEventListener('hidden.bs.modal', () => {
        document.getElementById('formUsuario').reset();
        document.getElementById('usuarioId').value = '';
        document.getElementById('modalUsuarioLabel').textContent = 'Novo Usuário';
        document.getElementById('btnSalvarUsuario').innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar';
        document.getElementById('senha').required = true;
        document.getElementById('senhaHelp').textContent = 'Mínimo 6 caracteres';
    });
});

async function carregarUsuarios() {
    const tbody = document.getElementById('tbodyUsuarios');

    try {
        estadoCarregando(tbody, 5);

        const response = await apiFetch('usuarios/listar.php');
        const data = await apiJson(response);

        if (!data.sucesso || !data.dados || data.dados.length === 0) {
            estadoVazio(tbody, 5, 'Nenhum usuário encontrado');
            return;
        }

        tbody.innerHTML = '';
        data.dados.forEach(u => {
            // Não mostrar botão de excluir para o próprio usuário
            const isCurrentUser = Number(u.id) === getCurrentUserId();

            const tr = document.createElement('tr');

            tr.appendChild(montarCelula(escapeHtml(u.nome)));
            tr.appendChild(montarCelula(escapeHtml(u.usuario)));

            const statusCelula = document.createElement('td');
            statusCelula.className = 'text-center';
            const statusSpan = document.createElement('span');
            statusSpan.className = `badge ${u.ativo ? 'bg-success' : 'bg-secondary'}`;
            statusSpan.textContent = u.ativo ? 'Ativo' : 'Inativo';
            statusCelula.appendChild(statusSpan);
            tr.appendChild(statusCelula);

            tr.appendChild(montarCelula(formatarDataHora(u.criado_em)));

            const tdAcoes = document.createElement('td');
            tdAcoes.className = 'text-end';

            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn btn-sm btn-outline-primary me-1';
            btnEditar.title = 'Editar';
            btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
            btnEditar.addEventListener('click', () => editarUsuario(Number(u.id)));

            tdAcoes.appendChild(btnEditar);

            if (!isCurrentUser) {
                const btnExcluir = document.createElement('button');
                btnExcluir.className = 'btn btn-sm btn-outline-danger';
                btnExcluir.title = 'Excluir';
                btnExcluir.innerHTML = '<i class="bi bi-trash"></i>';
                btnExcluir.addEventListener('click', async () => {
                    const confirmado = await confirmar(
                        'Excluir usuário',
                        `Tem certeza que deseja excluir o usuário "${escapeHtml(u.nome)}"?`
                    );
                    if (confirmado) await excluirUsuario(Number(u.id));
                });
                tdAcoes.appendChild(btnExcluir);
            }

            tr.appendChild(tdAcoes);
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Erro ao carregar usuários:', e);
        estadoErro(tbody, 5, 'Erro ao carregar usuários. Verifique a conexão e tente novamente.', carregarUsuarios);
    }
}

function getCurrentUserId() {
    return Number(sessionStorage.getItem('usuario_id')) || null;
}

function abrirModalNovo() {
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('modalUsuarioLabel').textContent = 'Novo Usuário';
    document.getElementById('btnSalvarUsuario').innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar';
    document.getElementById('senha').required = true;
    document.getElementById('senhaHelp').textContent = 'Mínimo 6 caracteres';
    document.getElementById('ativo').checked = true;
}

async function editarUsuario(id) {
    try {
        const response = await apiFetch('usuarios/listar.php');
        const data = await apiJson(response);

        if (!data.sucesso) {
            mostrarToast('Erro ao carregar dados do usuário.', 'danger');
            return;
        }

        const usuario = data.dados.find(u => Number(u.id) === Number(id));
        if (!usuario) {
            mostrarToast('Usuário não encontrado.', 'danger');
            return;
        }

        document.getElementById('usuarioId').value = usuario.id;
        document.getElementById('nome').value = usuario.nome;
        document.getElementById('usuario').value = usuario.usuario;
        document.getElementById('ativo').checked = usuario.ativo === 1 || usuario.ativo === true;

        // Senha não é preenchida por segurança
        document.getElementById('senha').value = '';
        document.getElementById('senha').required = false;
        document.getElementById('senhaHelp').textContent = 'Deixe em branco para não alterar';

        document.getElementById('modalUsuarioLabel').textContent = 'Editar Usuário';
        document.getElementById('btnSalvarUsuario').innerHTML = '<i class="bi bi-check-lg me-1"></i>Atualizar';

        const modal = new bootstrap.Modal(document.getElementById('modalUsuario'));
        modal.show();
    } catch (e) {
        console.error('Erro ao carregar usuário:', e);
        mostrarToast('Erro ao carregar usuário.', 'danger');
    }
}

async function salvarUsuario(e) {
    e.preventDefault();

    const id = document.getElementById('usuarioId').value;
    const isEdit = id !== '';

    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());
    dados.ativo = dados.ativo === 'on' ? 1 : 0;

    // Se estiver editando e senha estiver vazia, não enviar
    if (isEdit && !dados.senha) {
        delete dados.senha;
    }

    const url = isEdit ? 'usuarios/editar.php' : 'usuarios/cadastrar.php';

    const btn = document.getElementById('btnSalvarUsuario');
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
            bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
            carregarUsuarios();
            mostrarToast(isEdit ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!', 'success');
        } else {
            mostrarToast(result.mensagem, 'danger');
        }
    } catch (error) {
        mostrarToast('Erro ao salvar usuário.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function excluirUsuario(id) {
    try {
        const response = await apiFetch('usuarios/excluir.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        const result = await apiJson(response);

        if (result.sucesso) {
            carregarUsuarios();
            mostrarToast(result.mensagem || 'Usuário excluído com sucesso!', 'success');
        } else {
            mostrarToast(result.mensagem, 'danger');
        }
    } catch (error) {
        mostrarToast('Erro ao excluir usuário.', 'danger');
    }
}

async function logout() {
    await window.logout();
}

function formatarDataHora(dataString) {
    return window.formatarData(dataString, true);
}


