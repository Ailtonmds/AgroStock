# Sistema de Gerenciamento de Almoxarifado

Aplicação web para gerenciamento de produtos, categorias, lotes, estoque, movimentações, alertas, relatórios e usuários.

## Tecnologias

- Frontend: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Bootstrap Icons e Chart.js.
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
│   │   ├── css/       # Folhas de estilo (style.css)
│   │   ├── img/       # Imagens e logotipos
│   │   └── js/        # Scripts da interface e comunicação com a API
│   │       ├── api.js         # Camada de requisições HTTP (fetch)
│   │       ├── utils.js       # Utilitários compartilhados (toast, logout, formatação, confirmação)
│   │       ├── login.js       # Tela de login
│   │       ├── criar_usuario.js
│   │       ├── dashboard.js   # Painel principal
│   │       ├── produtos.js    # CRUD de produtos
│   │       ├── categorias.js  # CRUD de categorias
│   │       ├── lotes.js       # CRUD de lotes
│   │       ├── usuarios.js    # CRUD de usuários
│   │       ├── estoque_entrada.js
│   │       ├── estoque_saida.js
│   │       ├── estoque_movimentacoes.js
│   │       ├── alertas.js
│   │       └── relatorios.js
│   ├── criar-login/   # Endpoint para criar o usuário inicial
│   ├── pages/         # Telas HTML do sistema
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

## Melhorias de frontend (interface profissional)

O front-end foi redesenhado com foco em usabilidade, consistência visual e segurança:

- **Identidade visual unificada**: paleta de cores verde, tipografia Inter, cards com sombra suave, bordas arredondadas e estados de hover.
- **Componentes reutilizáveis**: `utils.js` centraliza `mostrarToast`, `logout`, `formatarData`, `escapeHtml`, `confirmar` (modal Bootstrap em vez de `confirm()` nativo) e helpers de estado de tabela (carregando, vazio, erro).
- **Segurança XSS**: todos os dados vindos do banco são escapados com `escapeHtml` antes de serem inseridos no DOM; atributos `onclick` inline foram substituídos por `addEventListener` com `dataset`.
- **Estado de carregamento/vazio/erro**: todas as tabelas exibem spinners, mensagens de "nenhum registro encontrado" e botões "Tentar novamente" em caso de falha.
- **Modal de confirmação**: exclusões usam um modal Bootstrap centralizado em vez de `window.confirm()`.
- **Card "Vencidos" no dashboard**: agora exibe o indicador de lotes vencidos (antes faltava na tela).
- **Paginação e filtros**: melhoria na navegação de movimentações e nos relatórios com estados visuais claros.
- **Responsividade**: layout ajustado para telas pequenas (mobile-first) com navbar colapsável e cards empilhados.

## Caminhos usados pelo frontend

- Os links entre telas são relativos a `frontend/pages/` e apontam para os arquivos HTML existentes nessa pasta.
- `frontend/assets/js/api.js` resolve os endpoints de API para a pasta irmã `backend/` na raiz do projeto.
- A criação do primeiro usuário é atendida por `frontend/criar-login/criar_usuario.php`.
- O sistema deve ser acessado pelo Apache (HTTP), pois PHP não é executado ao abrir os arquivos diretamente no navegador.

## Segurança

As operações de dados são atendidas no backend. Configure credenciais próprias para o banco e não publique senhas de ambiente em arquivos versionados.
