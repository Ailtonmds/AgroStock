# Sistema de Gerenciamento de Almoxarifado

Aplicação web para gerenciamento de produtos, categorias, lotes, estoque, movimentações, alertas, relatórios e usuários.

## Tecnologias

- Frontend: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Bootstrap Icons e Chart.js.
- Backend: PHP 8+ com PDO.
- Banco de dados: MySQL ou MariaDB.
- Leitor de código de barras: **Scan-To-Input** (JavaScript vanilla, zero dependências) para leitores USB/Bluetooth em modo teclado (HID).
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
│   │   └── buscar_por_codigo.php   # NOVO: busca produto por código de barras
│   ├── relatorios/    # Endpoints de relatórios
│   ├── usuarios/      # Endpoints de usuários
│   └── dashboard.php  # Dados do painel
├── database/          # Scripts SQL do banco
│   ├── database.sql
│   ├── dados_teste.sql
│   └── migration_codigo_barras.sql   # NOVO: adiciona coluna codigo_barras
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
│   │       ├── relatorios.js
│   │       └── scan-to-input.js   # NOVO: plugin de leitura de código de barras USB
│   ├── criar-login/   # Endpoint para criar o usuário inicial
│   ├── pages/         # Telas HTML do sistema
│   └── index.html     # Redireciona para a tela inicial
└── README.md
```

As telas ficam em `frontend/pages/`: `index.html` (login), `criar_login.html`, `dashboard.html`, `produtos.html`, `categorias.html`, `lotes.html`, `estoque.html`, `entrada.html`, `saida.html`, `movimentacoes.html`, `alertas.html`, `relatórios.html` e `usuarios.html`. O endereço `frontend/dashboard.html` redireciona para a tela de dashboard em `frontend/pages/dashboard.html`. Os endpoints PHP ficam em `backend/`, exceto o endpoint de criação inicial em `frontend/criar-login/criar_usuario.php`.

## Instalação local

1. Coloque o projeto na raiz pública do Apache, por exemplo `C:\laragon\www\sistema-tcc-2026`.
2. Inicie o Apache e o MySQL/MariaDB.
3. Ajuste host, porta, banco, usuário e senha em `backend/config/conexao.php`.
4. Importe `database/database.sql` para criar as tabelas.
5. Execute `database/migration_codigo_barras.sql` para adicionar a coluna `codigo_barras` à tabela `produtos` (necessário para o leitor de código de barras).
6. Se precisar dos registros de demonstração, importe também `database/dados_teste.sql`.
7. Abra `http://localhost/sistema-tcc-2026/frontend/` para iniciar o sistema. A página inicial redireciona para `frontend/pages/index.html`.

O acesso de login é `http://localhost/sistema-tcc-2026/frontend/pages/index.html`. A tela de criação inicial fica em `http://localhost/sistema-tcc-2026/frontend/pages/criar_login.html`.

## Leitor de código de barras USB (AgroStock)

O sistema inclui integração com leitores de código de barras USB/Bluetooth em modo teclado (HID) usando o plugin **Scan-To-Input** (`frontend/assets/js/scan-to-input.js`).

### Como configurar o leitor

1. Configure o leitor USB em **modo teclado (HID)** — a maioria dos leitores funciona desse modo por padrão.
2. Opcionalmente, configure o leitor para enviar **Enter ou Tab** após cada leitura (ajuda a confirmar a leitura).
3. Teste o leitor em um editor de texto: se ele "digita" os caracteres rapidamente, é compatível.

### Como usar nas telas de Estoque

Nas telas **Entrada de Estoque** (`entrada.html`) e **Saída de Estoque** (`saida.html`):

1. Aproxime o leitor do código de barras do produto.
2. O campo "Código de Barras (Leitor USB)" será preenchido automaticamente.
3. Clique em **"Buscar por Código"** (ou aguarde a detecção automática via `onScan`).
4. O produto e os lotes disponíveis são preenchidos automaticamente nos selects.
5. Informe a quantidade e registre a entrada/saída normalmente.

### Arquivos envolvidos na integração do leitor

- `frontend/assets/js/scan-to-input.js` — plugin de detecção de leitura USB
- `frontend/assets/js/estoque_entrada.js` — inicialização do leitor na tela de entrada
- `frontend/assets/js/estoque_saida.js` — inicialização do leitor na tela de saída
- `backend/produtos/buscar_por_codigo.php` — endpoint que busca produto por código de barras
- `database/migration_codigo_barras.sql` — adiciona coluna `codigo_barras` na tabela produtos

## Melhorias de frontend (interface profissional)

O front-end foi redesenhado com foco em usabilidade, consistência visual e segurança:

- **Identidade visual unificada**: paleta de cores verde, tipografia Inter, cards com sombra suave, bordas arredondados e estados de hover.
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

