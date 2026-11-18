# Sistema de Gerenciamento de Almoxarifado

Aplicação web para gerenciamento de produtos, categorias, lotes, estoque, movimentações, alertas, relatórios e autenticação de um único usuário.

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
│   ├── lotes/         # Endpoints de lotes (inclui código de barras SVG)
│   ├── produtos/      # Endpoints de produtos
│   │   ├── buscar_por_codigo.php   # Busca produto/lote por código de barras
│   │   └── codigos_fornecedores.php # CRUD de códigos de fornecedor
│   ├── Service/       # Serviços de negócio (código de barras)
│   ├── relatorios/    # Endpoints de relatórios
│   └── dashboard.php  # Dados do painel
├── database/          # Scripts SQL do banco
│   ├── database.sql
│   ├── migration_usuario_unico.sql # Remove níveis de acesso em bancos existentes
│   ├── dados_teste.sql
│   ├── migration_codigo_barras.sql        # Adiciona coluna codigo_barras à tabela produtos
│   └── migration_codigo_barras_interno.sql # Código interno do lote + códigos de fornecedor
├── docs/              # Documentação técnica
│   └── CODIGOS_DE_BARRAS.md
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
│   │       ├── produtos.js    # CRUD de produtos (com códigos de fornecedor)
│   │       ├── categorias.js  # CRUD de categorias
<<<<<<< HEAD
│   │       ├── lotes.js       # CRUD de lotes
│   │   │       ├── estoque_entrada.js
=======
│   │       ├── lotes.js       # CRUD de lotes (código interno + SVG)
│   │       ├── usuarios.js    # CRUD de usuários
│   │       ├── estoque_entrada.js
>>>>>>> melhoria-frontend-agrostock
│   │       ├── estoque_saida.js
│   │       ├── estoque_movimentacoes.js
│   │       ├── alertas.js
│   │       ├── relatorios.js
<<<<<<< HEAD
│   │       └── scan-to-input.js   # NOVO: plugin de leitura de código de barras USB
=======
│   │       └── scan-to-input.js   # Plugin de leitura de código de barras USB
│   ├── criar-login/   # Endpoint para criar o usuário inicial
>>>>>>> melhoria-frontend-agrostock
│   ├── pages/         # Telas HTML do sistema
│   └── index.html     # Redireciona para a tela inicial
└── vendor/            # Dependências do Composer (Picqer PHP Barcode Generator)
```

<<<<<<< HEAD
As telas ficam em `frontend/pages/`: `index.html` (login), `criar_login.html`, `dashboard.html`, `produtos.html`, `categorias.html`, `lotes.html`, `estoque.html`, `entrada.html`, `saida.html`, `movimentacoes.html`, `alertas.html`, `relatórios.html`. O endereço `frontend/dashboard.html` redireciona para a tela de dashboard em `frontend/pages/dashboard.html`. Os endpoints PHP ficam em `backend/`. A criação inicial da conta é feita por `backend/auth/criar_usuario.php`.
=======
As telas ficam em `frontend/pages/`: `index.html` (login), `criar_login.html`, `dashboard.html`, `produtos.html`, `categorias.html`, `lotes.html`, `estoque.html`, `entrada.html`, `saida.html`, `movimentacoes.html`, `alertas.html`, `relatórios.html`, `etiquetas.html` e `usuarios.html`. O endereço `frontend/dashboard.html` redireciona para a tela de dashboard em `frontend/pages/dashboard.html`. Os endpoints PHP ficam em `backend/`, exceto o endpoint de criação inicial em `frontend/criar-login/criar_usuario.php`.
>>>>>>> melhoria-frontend-agrostock

## Como rodar no navegador

### Opção A — Apache (Laragon / XAMPP / WAMP)

1. Coloque o projeto na raiz pública do Apache, por exemplo `C:\laragon\www\sistema-tcc-2026` ou `/var/www/html/sistema-tcc-2026`.
2. Inicie o Apache e o MySQL/MariaDB.
3. Configure as variáveis de ambiente `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASS` no Apache/PHP. Consulte `.env.example` como referência. O PHP não carrega arquivos `.env` automaticamente.
4. Importe `database/database.sql` para criar as tabelas.
<<<<<<< HEAD
5. Se o banco já existia antes desta atualização, execute `database/migration_usuario_unico.sql` para remover a coluna antiga de níveis de acesso. Em seguida, execute `database/migration_codigo_barras.sql` para adicionar a coluna `codigo_barras` à tabela `produtos` (necessário para o leitor de código de barras).
6. Se precisar dos registros de demonstração, importe também `database/dados_teste.sql`.
7. Abra `http://localhost/sistema-tcc-2026/frontend/` para iniciar o sistema. A página inicial redireciona para `frontend/pages/index.html`.

O acesso de login é `http://localhost/sistema-tcc-2026/frontend/pages/index.html`. A tela de criação da conta única fica em `http://localhost/sistema-tcc-2026/frontend/pages/criar_login.html`. O sistema permite somente a criação da primeira conta. Depois que ela existir, novos cadastros são bloqueados. Não existem níveis de acesso nem gerenciamento de múltiplos usuários.
=======
5. Execute `database/migration_codigo_barras.sql` para adicionar a coluna `codigo_barras` à tabela `produtos`.
6. Execute `database/migration_codigo_barras_interno.sql` para adicionar o código interno do lote e a tabela de códigos de fornecedor.
7. No diretório raiz, instale as dependências do Composer: `composer install` (gera a pasta `vendor/` com a biblioteca Picqer).
8. Se quiser registros de demonstração, importe também `database/dados_teste.sql`.
9. Abra `http://localhost/sistema-tcc-2026/frontend/` no navegador.

### Opção B — Linux com PHP embutido (sem Apache)

1. Inicie o MariaDB: `sudo systemctl start mariadb`.
2. Importe os SQL no banco `almoxarifado`:
   ```bash
   mariadb -u SEU_USUARIO -pSUA_SENHA almoxarifado < database/database.sql
   mariadb -u SEU_USUARIO -pSUA_SENHA almoxarifado < database/migration_codigo_barras.sql
   mariadb -u SEU_USUARIO -pSUA_SENHA almoxarifado < database/migration_codigo_barras_interno.sql
   mariadb -u SEU_USUARIO -pSUA_SENHA almoxarifado < database/dados_teste.sql
   ```
3. Ajuste as credenciais em `backend/config/conexao.php` se necessário.
4. Na raiz do projeto, inicie o servidor PHP:
   ```bash
   php -S 0.0.0.0:8080 -t .
   ```
5. Abra `http://localhost:8080/frontend/` no navegador.

### Telas de acesso

- Login: `http://localhost:8080/frontend/pages/index.html`
- Criar primeiro usuário: `http://localhost:8080/frontend/pages/criar_login.html`

**O sistema deve ser acessado via HTTP (Apache ou PHP embutido). Não funciona abrindo os arquivos HTML diretamente no navegador, pois o PHP não é executado.**
>>>>>>> melhoria-frontend-agrostock

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

As operações de dados são atendidas no backend. Configure credenciais próprias por variáveis de ambiente e nunca publique senhas reais. O banco de demonstração ainda contém um usuário inicial `admin` com senha padrão `admin123`; altere essa senha imediatamente após importar o banco. Em instalações novas, crie a primeira conta pela tela `criar_login.html`.

## Códigos de Barras (AgroStock)

O sistema agora inclui identificação de produtos e lotes por códigos de barras:

- **Código interno do lote:** gerado automaticamente no cadastro do lote (padrão `AG00000001`, exclusivo, não editável).
- **Códigos do fornecedor:** vários códigos externos podem ser associados a um produto (tabela `codigos_fornecedores`).
- **Geração de código de barras:** backend PHP com a biblioteca Picqer (Code 128), localmente, sem serviços externos.
- **Visualização:** endpoint `backend/lotes/codigo_barras.php?id=<lote_id>` retorna o SVG do código de barras.
- **Impressão de etiquetas:** tela `frontend/pages/etiquetas.html` com formatos 50×30 mm e 60×40 mm e CSS `@media print`.
- **Leitor USB:** funciona como teclado (HID). Códigos internos localizam o lote diretamente; códigos de fornecedor localizam o produto.
- **Entrada/Saída:** integrados à leitura de códigos para identificar produto/lote.

Consulte `docs/CODIGOS_DE_BARRAS.md` para a documentação técnica completa (banco de dados, endpoints, algoritmo de geração, impressão e testes).


