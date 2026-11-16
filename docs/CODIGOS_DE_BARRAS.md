# Códigos de Barras - AgroStock

Documentação técnica da implementação do sistema de identificação de produtos e lotes por códigos de barras.

## 1. Biblioteca utilizada

- **Picqer PHP Barcode Generator** (`picqer/php-barcode-generator`, v3.3.1)
- Gerenciamento de dependências via **Composer**
- Formato principal: **Code 128**
- Geração 100% local (backend PHP), sem depender de serviços externos ou conexão com a internet
- Não são salvas imagens SVG no banco de dados: armazena-se somente o conteúdo textual do código de barras

### Instalação

```bash
composer require picqer/php-barcode-generator
```

O autoload do Composer é carregado no serviço de geração (`backend/Service/CodigoBarrasService.php`) via `require_once __DIR__ . '/../../vendor/autoload.php'`.

## 2. Estrutura do banco de dados

### Tabela `lotes` (alteração)
Coluna adicionada:

| Coluna | Tipo | Nulo | Descrição |
|--------|------|------|-----------|
| `codigo_barras_interno` | `VARCHAR(50)` | SÍ | Código interno exclusivo do lote (ex: `AG00000001`) |

- Índice `UNIQUE` (`uk_lotes_codigo_barras_interno`) garante exclusividade.
- Permite `NULL` para manter compatibilidade com registros antigos criados antes desta funcionalidade.

### Tabela `codigos_fornecedores` (nova)

| Coluna | Tipo | Nulo | Descrição |
|--------|------|------|-----------|
| `id` | `INT UNSIGNED` | NÃO | PK |
| `produto_id` | `INT UNSIGNED` | NÃO | FK → `produtos(id)` |
| `codigo_barras` | `VARCHAR(100)` | NÃO | Código externo do fornecedor (UNIQUE) |
| `tipo_codigo` | `VARCHAR(50)` | SÍ | Ex: EAN-13 |
| `origem` | `VARCHAR(100)` | SÍ | Ex: Fabricante |
| `criado_em` | `TIMESTAMP` | NÃO | Data de criação |

- Relacionamento 1:N: um produto pode ter vários códigos de fornecedor.
- Código preservado exatamente como recebido (incluindo zeros iniciais).

### Arquivo de migração

`database/migration_codigo_barras_interno.sql` — executar após `database.sql`. Não apaga dados existentes e não recria tabelas.

## 3. Algoritmo de geração do código interno

O código interno do lote é gerado automaticamente no backend (`App\Service\CodigoBarrasService`), seguindo o padrão:

```
AG00000001
AG00000002
AG00000003
```

Regras:

1. Gerado no momento da criação do lote (`backend/lotes/cadastrar.php`).
2. Não é editável pelo usuário.
3. Sequência baseada no maior código interno já existente, somando 1, com preenchimento de zeros à esquerda (8 dígitos) e prefixo `AG`.
4. Operação segura em concorrência: dentro de uma transação, o código candidato é verificado contra a tabela `lotes` antes do INSERT; se já existir, gera o próximo.
5. Restrição `UNIQUE` no banco impede duplicidades.
6. Códigos de lotes excluídos não são reutilizados.
7. Não depende do nome do produto.

## 4. Endpoints criados

Todos os endpoints exigem sessão autenticada (`backend/auth/verificar_sessao.php`) e usam consultas preparadas com PDO.

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `backend/lotes/cadastrar.php` | POST | Cadastra lote e gera código interno automaticamente |
| `backend/lotes/listar.php` | GET | Lista lotes (inclui `codigo_barras_interno`) |
| `backend/lotes/codigo_barras.php` | GET | Retorna o SVG do código de barras interno de um lote (`?id=<lote_id>`, `Content-Type: image/svg+xml`) |
| `backend/produtos/codigos_fornecedores.php` | GET/POST/DELETE | CRUD de códigos de fornecedor de produtos |
| `backend/produtos/cadastrar.php` | POST | Cadastra produto (salva `codigo_barras` e códigos de fornecedor) |
| `backend/produtos/editar.php` | POST | Edita produto (atualiza `codigo_barras` e substitui códigos de fornecedor) |
| `backend/produtos/buscar_por_codigo.php` | GET | Busca por código: identifica se é lote interno (`tipo: lote`), fornecedor (`tipo: fornecedor`) ou produto (`tipo: produto`) |

## 5. Funcionamento do SVG

O endpoint `backend/lotes/codigo_barras.php`:

1. Recebe o `id` do lote via GET.
2. Consulta o lote no banco e valida a existência.
3. Verifica se o lote possui `codigo_barras_interno`.
4. Gera o SVG com Picqer (`TypeCode128` + `SvgRenderer`), Code 128.
5. Retorna o conteúdo com `Content-Type: image/svg+xml`.
6. Não aceita conteúdo SVG arbitrário do frontend: o código é obtido exclusivamente do banco.

Exemplo de uso no frontend:

```html
<img src="../../backend/lotes/codigo_barras.php?id=13" alt="Código de barras">
```

## 6. Processo de impressão

Página `frontend/pages/etiquetas.html`:

- Lista os lotes cadastrados com código interno.
- Botão "Gerar etiqueta" por lote ou "Visualizar todas".
- Dois formatos de etiqueta: **50 × 30 mm** e **60 × 40 mm**.
- CSS `@media print` com `@page { margin: 0; }` e classes `.no-print` para ocultar controles na impressão.
- Cada etiqueta exibe: identificação AgroStock, nome do produto, número do lote, validade, quantidade, código de barras (SVG) e código textual abaixo.
- Botão "Imprimir" aciona `window.print()` do navegador.

## 7. Integração com scanner USB

O leitor USB funciona como dispositivo de teclado (HID), sem driver específico (plugin `ScanToInput`).

Fluxo de leitura (`estoque_entrada.js` e `estoque_saida.js`):

1. Recebe os caracteres do leitor.
2. Identifica o código completo (Enter do scanner).
3. Consulta `backend/produtos/buscar_por_codigo.php?codigo_barras=...`.
4. O backend identifica o tipo (`lote`, `fornecedor` ou `produto`).
5. **Código interno (`tipo: lote`):** localiza diretamente o lote e seleciona produto + lote automaticamente.
6. **Código do fornecedor/produto (`tipo: fornecedor` ou `produto`):** localiza o produto e exibe os lotes disponíveis para o usuário selecionar.
7. Não registra movimentação automaticamente; o usuário confirma a entrada/saída.

## 8. Integração com entradas e saídas

- **Entrada:** ler código do fornecedor → localizar produto → selecionar/cadastrar lote → informar quantidade → registrar entrada.
- **Saída:** ler código interno do lote → localizar lote exato → apresentar produto, validade e quantidade → informar saída → validar saldo disponível → registrar saída.
- As validações existentes (estoque insuficiente, lote vinculado, usuário autenticado) são preservadas.

## 9. Segurança e validações

- Consultas preparadas com PDO (`ATTR_EMULATE_PREPARES => false`).
- Restrição `UNIQUE` para códigos internos e códigos de fornecedor.
- Validação de códigos duplicados no backend.
- Validação de lotes e produtos inexistentes.
- Transações para operações relacionadas (cadastro de lote com código interno).
- Sessão autenticada em todos os endpoints.
- Validações no backend (não confiar somente no JavaScript).

## 10. Testes realizados

| Cenário | Resultado |
|---------|-----------|
| Criar lote | Código interno gerado automaticamente |
| Criar segundo lote | Código exclusivo diferente (AG00000002) |
| Dois lotes do mesmo produto | Códigos diferentes |
| Ler código interno | Localiza lote exato (tipo: lote) |
| Ler código do fornecedor | Localiza produto (tipo: fornecedor) |
| Imprimir etiqueta | SVG renderizado com `Content-Type: image/svg+xml` |
| Código inexistente | Mensagem de erro adequada (404) |
| Código duplicado | Impedido pelo UNIQUE e tratamento no backend |
| Saída com saldo insuficiente | Impedida (validação existente) |

## 11. Arquivos alterados/criados

### Banco de dados
- `database/migration_codigo_barras_interno.sql` (novo)

### Backend
- `composer.json` / `composer.lock` / `vendor/` (novo — Picqer)
- `backend/Service/CodigoBarrasService.php` (novo)
- `backend/lotes/cadastrar.php` (alterado — gera código interno)
- `backend/lotes/listar.php` (alterado — inclui `codigo_barras_interno`)
- `backend/lotes/codigo_barras.php` (novo — endpoint SVG)
- `backend/produtos/cadastrar.php` (alterado — salva `codigo_barras` e fornecedores)
- `backend/produtos/editar.php` (alterado — atualiza `codigo_barras` e fornecedores)
- `backend/produtos/buscar_por_codigo.php` (alterado — identifica lote/fornecedor/produto)
- `backend/produtos/codigos_fornecedores.php` (novo — CRUD fornecedores)

### Frontend
- `frontend/pages/etiquetas.html` (novo — impressão de etiquetas)
- `frontend/pages/lotes.html` (alterado — coluna código interno + seção identificação)
- `frontend/pages/produtos.html` (alterado — campo código de barras + fornecedores)
- `frontend/assets/js/lotes.js` (alterado — renderiza código interno + SVG)
- `frontend/assets/js/produtos.js` (alterado — gerencia códigos de fornecedor)
- `frontend/assets/js/estoque_entrada.js` (alterado — scanner interno/fornecedor)
- `frontend/assets/js/estoque_saida.js` (alterado — scanner interno/fornecedor)
- Páginas com sidebar: link "Etiquetas" adicionado

## 12. Identidade visual

Mantida a paleta do AgroStock (verde principal `#246B3A`, verde escuro `#123D24`, fundo `#F5F7F5`), componentes Bootstrap 5 e responsividade.
