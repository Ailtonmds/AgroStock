# Implementação do Scanner de Código de Barras — AgroStock

**Data:** 17/11/2026  
**Projeto:** AgroStock — Sistema de Gerenciamento de Almoxarifado (TCC 2026)  
**Versão:** 1.0

---

## 1. Visão Geral

Este documento descreve a implementação completa da integração do leitor de código de barras (scanner USB/Bluetooth HID) no sistema AgroStock, abrangendo:

- Cadastro de produtos com código de barras
- Leitura automática na entrada de estoque
- Leitura automática na saída de estoque (com FEFO)
- Feedback visual e sonoro
- Validação de padrões de códigos (EAN-8, EAN-13, UPC-A, Code 128, ITF-14)
- Segurança (PDO, consultas preparadas, transações, índice UNIQUE)
- Histórico separado de leituras do scanner

A arquitetura, padrão visual, tecnologias e funcionalidades existentes foram preservadas.

---

## 2. Arquivos Criados

| Arquivo | Responsabilidade |
|---------|------------------|
| `docs/AUDITORIA_SCANNER.md` | Diagnóstico inicial de problemas |
| `docs/IMPLEMENTACAO_SCANNER.md` | Este documento |
| `docs/TESTES_SCANNER.md` | Resultados dos testes |
| `frontend/assets/js/scanner-feedback.js` | Feedback visual e sonoro do scanner |
| `frontend/assets/js/codigo-barras-validacao.js` | Validação de padrões de código de barras |
| `backend/registro/registrar_leitura.php` | Endpoint para registrar leituras no histórico |
| `database/migration_unique_codigo_barras_produtos.sql` | Garante índice UNIQUE em produtos.codigo_barras |
| `database/migration_historico_leituras_scanner.sql` | Cria tabela de histórico de leituras |
| `tests/scanner.test.js` | Testes automatizados (Playwright + Firefox) |
| `playwright.config.js` | Configuração do Playwright |

---

## 3. Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `frontend/assets/js/scan-to-input.js` | Reescrito com controle de requisições simultâneas, anti-duplicata, estados (aguardando/processando/identificado/erro), métodos iniciar/pausar/encerrar, não captura em campos interativos |
| `frontend/assets/js/estoque_entrada.js` | Integra scanner-feedback, validação de códigos, registro de histórico de leituras, novo lote na tela, ordenação FEFO dos lotes |
| `frontend/assets/js/estoque_saida.js` | Integra scanner-feedback, validação de códigos, registro de histórico, FEFO, bloqueio de lote vencido, confirmação de saída em lote vencido |
| `frontend/pages/entrada.html` | Container de feedback visual, botão "Novo Lote", modal de novo lote, novos scripts |
| `frontend/pages/saida.html` | Container de feedback visual, novos scripts |
| `frontend/pages/produtos.html` | Script `codigo-barras-validacao.js` adicionado |
| `frontend/assets/js/produtos.js` | Validação de formato de código de barras antes de salvar |
| `backend/produtos/cadastrar.php` | Validação de duplicidade de `codigo_barras` antes de inserir |
| `backend/produtos/editar.php` | Validação de duplicidade de `codigo_barras` (excluindo o próprio produto) antes de atualizar |

---

## 4. Funcionalidades Implementadas

### 4.1 Cadastro de Códigos (Etapa 2)

- Campo `codigo_barras` presente no cadastro e edição de produtos (`produtos.html`).
- Permite editar o código de barras ao editar um produto.
- Permite consultar o código cadastrado (listagem e busca).
- Salva corretamente no banco (coluna `codigo_barras` VARCHAR(50)).
- Carrega o código ao editar um produto (`editarProduto` já preenchia o campo).
- Permite produtos sem código de barras (valor NULL).
- Validação de formato antes de salvar (frontend, via `CodigoBarrasValidacao`).
- Validação de duplicidade no backend (`cadastrar.php`, `editar.php`).
- Índice UNIQUE no banco (`produtos.codigo_barras`) para impedir duplicatas em nível de banco.
- Mensagens de sucesso e erro via toast.

### 4.2 Suporte a Padrões de Códigos (Etapa 3)

Implementado em `frontend/assets/js/codigo-barras-validacao.js`:

| Padrão | Características | Validação de DV |
|--------|----------------|-----------------|
| EAN-8 | 8 dígitos numéricos | Sim |
| EAN-13 | 13 dígitos numéricos | Sim |
| UPC-A | 12 dígitos numéricos | Sim |
| ITF-14 | 14 dígitos numéricos | Sim |
| Code 128 | Alfanumérico, tamanho variável | Não (genérico) |

Regras respeitadas:
- Códigos tratados como STRING (preserva zeros à esquerda).
- Nunca converte para número inteiro.
- Armazenados como VARCHAR.
- Code 128 aceita letras e números.
- Não rejeita códigos válidos apenas pelo comprimento (se não se encaixar num padrão numérico com DV, é tratado como Code 128 genérico).

### 4.3 Captura do Scanner (Etapa 4)

`scan-to-input.js` reescrito com:

- Captura automática de caracteres (teclado HID).
- Identificação de leituras rápidas (threshold configurável).
- Tratamento do Enter (e Tab) enviado pelo scanner como gatilho.
- Controle do tempo entre caracteres.
- Limpeza automática do buffer após processamento.
- Prevenção de leituras incompletas (minLength).
- Prevenção de leituras duplicadas (duplicateTimeout).
- Controle de requisições simultâneas (uma leitura por vez).
- Liberação para nova leitura após finalizar (busyTimeout).
- Tratamento de erros.
- Controle correto do foco (não captura em inputs/selects/textarea onde o usuário digita manualmente).
- Métodos: `iniciar()`, `pausar()`, `encerrar()`.

### 4.4 Feedback Visual e Sonoro (Etapa 5)

`scanner-feedback.js` com:

**Sons (Web Audio API, sem arquivos externos, não bloqueiam):**
- Leitura bem-sucedida (tons ascendentes).
- Produto não encontrado (tons graves descendentes).
- Código inválido (tons alternados de alerta).
- Erro de comunicação (tom baixo prolongado).

**Estados visuais (indicador fixo superior-direito):**
- Aguardando leitura (cinza).
- Processando leitura (azul, pulsante).
- Produto identificado (verde).
- Erro na leitura (vermelho, pulsante rápido).

**Mensagens:**
- Produto encontrado (nome, código, estoque).
- Produto não encontrado (código não cadastrado).
- Código inválido (motivo da validação).
- Erro de comunicação (servidor não respondeu).

### 4.5 Entrada de Estoque (Etapa 6)

- Leitura automática do produto pelo código.
- Identificação do produto e apresentação dos dados.
- Permite informar quantidade.
- Permite selecionar lote existente.
- Permite cadastrar novo lote diretamente na tela (modal).
- Permite informar validade (no cadastro de lote).
- Valida dados antes de registrar.
- Atualiza estoque corretamente (backend `entrada.php` com transação).
- Registra movimentação no histórico.
- A leitura NÃO registra entrada automaticamente (exige confirmação do usuário).

### 4.6 Saída de Estoque (Etapa 7)

- Leitura automática do produto.
- Identificação do produto.
- Apresenta lotes disponíveis com quantidades.
- Permite selecionar o lote.
- Valida quantidade solicitada.
- Impede saída superior ao estoque disponível (frontend `max` e backend `409`).
- Atualiza estoque corretamente (backend `saida.php` com transação e `FOR UPDATE`).
- Registra movimentação.
- **FEFO:** lotes ordenados por validade mais próxima primeiro.
- Não permite retirada de lote vencido sem confirmação explícita.
- A leitura NÃO registra saída automaticamente (exige confirmação).

### 4.7 Segurança e Banco de Dados (Etapa 8)

- PDO e consultas preparadas em todos os endpoints (padrão existente mantido).
- Validação de dados recebidos pelo backend.
- Sem SQL Injection (consultas preparadas, `PDO::ATTR_EMULATE_PREPARES => false`).
- Validação de códigos de barras duplicados (frontend + backend + índice UNIQUE).
- Tratamento de exceções (try/catch, mensagens genéricas, não expõe internas).
- Integridade das movimentações (transações em entrada/saída).
- Evita atualizações concorrentes (`FOR UPDATE` em saída).
- Índices criados somente os necessários.
- Nenhuma tabela, coluna ou registro apagado.

### 4.8 Histórico de Leituras (Etapa 9)

- Tabela `historico_leituras_scanner` separada de `movimentacoes`.
- Registra: código lido, produto identificado, data/horário, resultado, tela de origem, usuário.
- Uma leitura não significa necessariamente uma movimentação.
- Endpoint `registro/registrar_leitura.php`.

---

## 5. Configuração do Leitor de Código de Barras

O leitor USB/Bluetooth deve estar em **modo teclado (HID)**.

Passos:
1. Conectar o leitor em modo HID (a maioria funciona assim por padrão).
2. Configurar o leitor para enviar **Enter** após cada leitura (ajuda a confirmar).
3. Testar em um editor de texto: se "digita" os caracteres rapidamente, é compatível.
4. No AgroStock, posicionar o cursor no campo "Código de Barras (Leitor USB)" nas telas de Entrada/Saída e aproximar o leitor.

Sufixos recomendados: Enter (tecla `Enter`) para disparo imediato da leitura.

---

## 6. Alterações no Banco de Dados

### 6.1 Índice UNIQUE em produtos.codigo_barras

Arquivo: `database/migration_unique_codigo_barras_produtos.sql`

Garante que não haja códigos de barras duplicados na tabela `produtos`. Permite múltiplos NULL (produtos sem código).

Antes de executar, verificar duplicados:
```sql
SELECT codigo_barras, COUNT(*) AS qtd
FROM produtos
WHERE codigo_barras IS NOT NULL
GROUP BY codigo_barras
HAVING qtd > 1;
```

### 6.2 Tabela de histórico de leituras

Arquivo: `database/migration_historico_leituras_scanner.sql`

Cria `historico_leituras_scanner` separada de `movimentacoes`.

---

## 7. Migrações Necessárias

Executar na ordem:

1. `database/database.sql` (schema base)
2. `database/migration_codigo_barras.sql` (coluna codigo_barras)
3. `database/migration_codigo_barras_interno.sql` (codigos_fornecedores + codigo interno lote)
4. `database/migration_unique_codigo_barras_produtos.sql` (índice UNIQUE)
5. `database/migration_historico_leituras_scanner.sql` (tabela histórico leituras)
6. (Opcional) `database/dados_teste.sql`

Comando exemplo (MariaDB):
```bash
mariadb -u USUARIO -pSENHA almoxarifado < database/migration_unique_codigo_barras_produtos.sql
mariadb -u USUARIO -pSENHA almoxarifado < database/migration_historico_leituras_scanner.sql
```

---

## 8. Tecnologias Preservadas

- Frontend: HTML5, CSS3, JavaScript (ES6+ puro), Bootstrap 5, Bootstrap Icons.
- Backend: PHP 8+ com PDO.
- Banco: MariaDB/MySQL.
- Sem React, sem bibliotecas desnecessárias.

---

## 9. Limitações

- Testes de hardware físico de leitor USB/Bluetooth não foram realizados (não há leitor disponível no ambiente). Todos os testes de scanner são simulados via teclado.
- O erro de console "Erro ao carregar dashboard" e "too much recursion" na tela do dashboard são pré-existentes e não relacionados ao scanner.
- O submissão do formulário de cadastro via UI (clique no botão Salvar) não foi validada completamente no ambiente de teste headless (possível interação com Bootstrap modal); o backend foi validado diretamente via requisições HTTP.