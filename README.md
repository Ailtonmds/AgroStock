# Sistema de Gerenciamento de Almoxarifado

Aplicação web para gerenciamento de produtos, categorias, lotes, estoque, movimentações, alertas, relatórios e usuários.

## Tecnologias

- Frontend: HTML, CSS, JavaScript, Bootstrap e Chart.js.
- Backend: PHP 8+ com PDO.
- Banco de dados: MySQL ou MariaDB.
- Servidor local: Apache via Laragon, XAMPP ou WAMP.

## Estrutura atual

```text
sistema-tcc-2026/
├── backend/
│   ├── alertas/       # Endpoints de alertas
│   ├── auth/          # Login, logout e validação de sessão
│   ├── categorias/    # Endpoints de categorias
│   ├── config/        # Conexão e configurações
│   ├── estoque/       # Entradas, saídas e movimentações
│   ├── lotes/         # Endpoints de lotes
│   ├── produtos/      # Endpoints de produtos
│   ├── relatorios/    # Endpoints de relatórios
│   ├── usuarios/      # Endpoints de usuários
│   └── dashboard.php  # Dados do painel
├── database/          # Scripts SQL do banco
├── frontend/
│   ├── assets/
│   │   ├── css/       # Folhas de estilo
│   │   ├── img/       # Imagens e logotipos
│   │   └── js/        # Scripts da interface e comunicação com a API
│   ├── criar-login/   # Endpoint para criar o usuário inicial
│   ├── pages/         # Telas HTML do sistema
│   ├── padrão/        # Arquivo de cabeçalho legado
│   └── index.html     # Redireciona para a tela inicial
└── README.md
```

As telas ficam em `frontend/pages/`: `index.html` (login), `criar_login.html`, `dashboard.html`, `produtos.html`, `categorias.html`, `lotes.html`, `estoque.html`, `entrada.html`, `saida.html`, `movimentacoes.html`, `alertas.html`, `relatorios.html` e `usuarios.html`. O endereço `frontend/dashboard.html` redireciona para a tela de dashboard em `frontend/pages/dashboard.html`. Os endpoints PHP ficam em `backend/`, exceto o endpoint de criação inicial em `frontend/criar-login/criar_usuario.php`.

## Instalação local

1. Coloque o projeto na raiz pública do Apache, por exemplo `C:\laragon\www\sistema-tcc-2026`.
2. Inicie o Apache e o MySQL/MariaDB.
3. Ajuste host, porta, banco, usuário e senha em `backend/config/conexao.php`.
4. Importe `database/database.sql` para criar as tabelas. Se precisar dos registros de demonstração, importe também `database/dados_teste.sql`.
5. Abra `http://localhost/sistema-tcc-2026/frontend/` para iniciar o sistema. A página inicial redireciona para `frontend/pages/index.html`.

O acesso de login é `http://localhost/sistema-tcc-2026/frontend/pages/index.html`. A tela de criação inicial fica em `http://localhost/sistema-tcc-2026/frontend/pages/criar_login.html`.

## Caminhos usados pelo frontend

- Os links entre telas são relativos a `frontend/pages/` e apontam para os arquivos HTML existentes nessa pasta.
- `frontend/assets/js/api.js` resolve os endpoints de API para a pasta irmã `backend/` na raiz do projeto.
- A criação do primeiro usuário é atendida por `frontend/criar-login/criar_usuario.php`.
- O sistema deve ser acessado pelo Apache (HTTP), pois PHP não é executado ao abrir os arquivos diretamente no navegador.

## Segurança

As operações de dados são atendidas no backend. Configure credenciais próprias para o banco e não publique senhas de ambiente em arquivos versionados.
