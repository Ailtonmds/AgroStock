# Auditoria Técnica — Scanner de Código de Barras (AgroStock)

**Data:** 17/11/2026  
**Projeto:** AgroStock — Sistema de Gerenciamento de Almoxarifado (TCC 2026)  
**Escopo:** Integração do leitor de código de barras (Scan-To-Input) com cadastro de produtos, entrada e saída de estoque.

---

## 1. Resumo Executivo

O sistema AgroStock já possui uma base funcional de leitura de códigos de barras via scanner USB/Bluetooth HID (modo teclado), utilizando o plugin `scan-to-input.js`. No entanto, a auditoria identificou diversas falhas de integração, validação, segurança, feedback ao usuário e consistência entre frontend e backend que impedem o uso profissional e confiável do scanner.

O diagnóstico abaixo lista os problemas encontrados, os arquivos envolvidos e as correções necessárias, etapa por etapa.

---

## 2. Arquivos Envolvidos na Integração do Scanner

| Arquivo | Responsabilidade |
|---------|------------------|
| `frontend/assets/js/scan-to-input.js` | Plugin de detecção de leitura USB/Bluetooth (HID) |
| `frontend/assets/js/estoque_entrada.js` | Lógica da tela de entrada de estoque + scanner |
| `frontend/assets/js/estoque_saida.js` | Lógica da tela de saída de estoque + scanner |
| `frontend/assets/js/produtos.js` | CRUD de produtos (inclui campo `codigo_barras` e códigos de fornecedor) |
| `frontend/pages/produtos.html` | Tela de cadastro/edição de produtos |
| `frontend/pages/entrada.html` | Tela de entrada de estoque |
| `frontend/pages/saida.html` | Tela de saída de estoque |
| `frontend/assets/js/api.js` | Camada de requisições HTTP (fetch) |
| `frontend/assets/js/utils.js` | Utilitários (toast, escape, confirmação) |
| `backend/produtos/buscar_por_codigo.php` | Busca produto/lote por código de barras |
| `backend/produtos/cadastrar.php` | Cadastro de produto |
| `backend/produtos/editar.php` | Edição de produto |
| `backend/estoque/entrada.php` | Registro de entrada de estoque |
| `backend/estoque/saida.php` | Registro de saída de estoque |
| `backend/Service/CodigoBarrasService.php` | Serviço de geração/sanitização de códigos |
| `database/migration_codigo_barras.sql` | Adiciona coluna `codigo_barras` à tabela produtos |
| `database/migration_codigo_barras_interno.sql` | Tabela `codigos_fornecedores` + código interno do lote |

---

## 3. Problemas Encontrados por Etapa

### Etapa 1 — Cadastro de Códigos

| # | Problema | Arquivo(s) | Severidade |
|---|----------|------------|------------|
| C1 | O campo `codigo_barras` existe no HTML e no PHP, mas **não há validação de duplicidade** no backend `cadastrar.php` nem `editar.php`. | `cadastrar.php`, `editar.php` | Alta |
| C2 | O campo `codigo_barras` da tabela `produtos` **não possui índice UNIQUE**, permitindo duplicatas no banco. | `migration_codigo_barras.sql`, `database.sql` | Alta |
| C3 | Não há validação de formato (EAN-8, EAN-13, UPC-A, Code 128) no cadastro. | `produtos.js`, `cadastrar.php` | Média |
| C4 | Não há feedback visual claro de sucesso/erro específico para código de barras duplicado. | `produtos.js`, `cadastrar.php` | Média |
| C5 | Produtos sem código de barras são permitidos (NULL), o que é correto, mas não há orientação visual. | `produtos.html` | Baixa |

**Verificação de duplicados existentes no banco:** Nenhum duplicado encontrado na coluna `produtos.codigo_barras` (consulta executada em 17/11/2026). Alguns produtos possuem `codigo_barras = NULL`, o é aceitável.

### Etapa 2 — Suporte a Padrões de Códigos

| # | Problema | Arquivo(s) | Severidade |
|---|----------|------------|------------|
| P1 | A validação `validation: (code) => /^[A-Za-z0-9]{6,20}$/` em `estoque_entrada.js` e `estoque_saida.js` aceita qualquer alfanumérico de 6-20 chars, mas **não valida dígito verificador** de EAN-8/EAN-13/UPC-A. | `estoque_entrada.js`, `estoque_saida.js` | Média |
| P2 | O Code 128 permite letras e números, mas a validação atual não distingue formatos. | `estoque_entrada.js`, `estoque_saida.js` | Média |
| P3 | Não há preservação explícita de zeros à esquerda (o campo é `type="text"`, o que está correto, mas a validação regex pode rejeitar códigos curtos). | `estoque_entrada.js`, `estoque_saida.js` | Média |
| P4 | Não há rejeição explícita de códigos que não tenham 8, 12, 13 ou 14 dígitos — isso está correto na prática, mas não há validação de formato por padrão. | — | Baixa |

### Etapa 3 — Captura do Scanner

| # | Problema | Arquivo(s) | Severidade |
|---|----------|------------|------------|
| S1 | O `ScanToInput` captura eventos de teclado em **document** globalmente, sem excluir campos de quantidade, observação e outros elementos interativos. Pode interferir na digitação manual. | `scan-to-input.js` | Alta |
| S2 | Não há **controle de requisições simultâneas** — duas leituras rápidas podem disparar duas requisições concorrentes ao backend. | `estoque_entrada.js`, `estoque_saida.js` | Alta |
| S3 | Não há **prevenção de leituras duplicadas** — o mesmo código lido duas vezes seguidas processa duas vezes. | `estoque_entrada.js`, `estoque_saida.js` | Média |
| S4 | Não há **liberação explícita para nova leitura** após finalizar a anterior (estado de "processando"). | `scan-to-input.js` | Média |
| S5 | Não há métodos organizados de **iniciar, pausar e encerrar** a captura. | `scan-to-input.js` | Média |
| S6 | O `inputSelector: '[data-scan-box]'` preenche o **primeiro** input encontrado (mode: overwrite), o que pode preencher o campo errado se houver múltiplos. | `estoque_entrada.js`, `estoque_saida.js` | Média |

### Etapa 4 — Feedback Visual e Sonoro

| # | Problema | Arquivo(s) | Severidade |
|---|----------|------------|------------|
| F1 | **Não há feedback sonoro** para leitura bem-sucedida, produto não encontrado ou código inválido. | `estoque_entrada.js`, `estoque_saida.js`, `scan-to-input.js` | Média |
| F2 | **Não há indicação visual de estado do scanner** (aguardando, processando, identificado, erro). | `estoque_entrada.js`, `estoque_saida.js`, HTML | Média |
| F3 | Mensagens de erro de comunicação são genéricas ("Erro ao buscar produto.") e não diferenciam erro de servidor de "não encontrado". | `estoque_entrada.js`, `estoque_saida.js` | Média |

### Etapa 5 — Entrada de Estoque

| # | Problema | Arquivo(s) | Severidade |
|---|----------|------------|------------|
| E1 | A leitura de produto **não registra entrada automaticamente** — isso já está correto (exige confirmação). | `estoque_entrada.js` | OK |
| E2 | Não há **cadastro de novo lote** diretamente na tela de entrada (o usuário deve ir para a tela de lotes). | `entrada.html`, `estoque_entrada.js` | Média |
| E3 | Não há seleção de lote baseada em FEFO (apenas lista ordenada por validade no backend). | `buscar_por_codigo.php`, `lotes/listar.php` | Baixa |

### Etapa 6 — Saída de Estoque

| # | Problema | Arquivo(s) | Severidade |
|---|----------|------------|------------|
| S1 | A saída **bloqueia quantidade superior ao disponível** no backend (correto). | `saida.php` | OK |
| S2 | Não há **conceito FEFO explícito** na tela de saída (priorizar lote com vencimento mais próximo). | `estoque_saida.js`, `buscar_por_codigo.php` | Média |
| S3 | Não impede retirada de lotes vencidos (apenas aviso na entrada, não na saída). | `saida.php` | Média |

### Etapa 7 — Segurança e Banco de Dados

| # | Problema | Arquivo(s) | Severidade |
|---|----------|------------|------------|
| B1 | Backend `buscar_por_codigo.php` usa PDO preparadas (OK). | `buscar_por_codigo.php` | OK |
| B2 | Erro de PDO expõe apenas mensagem genérica "Erro ao buscar código de barras." (OK, não expõe internas). | `buscar_por_codigo.php` | OK |
| B3 | Não há transação nas operações de leitura (não precisa, são SELECT). | — | OK |
| B4 | Índice `idx_produtos_codigo_barras` não é UNIQUE. | `migration_codigo_barras.sql` | Alta |
| B5 | Tabela `codigos_fornecedores` tem `uk_codigo_barras_fornecedor` UNIQUE (OK). | `migration_codigo_barras_interno.sql` | OK |

### Etapa 8 — Histórico de Leituras

| # | Problema | Arquivo(s) | Severidade |
|---|----------|------------|------------|
| H1 | **Não existe tabela de histórico de leituras do scanner.** As leituras não são registradas separadamente das movimentações. | — | Média |
| H2 | Uma leitura não significa necessariamente movimentação, mas não há forma de distinguir. | — | Média |

---

## 4. Duplicações ou Conflitos Identificados

- **Não há implementações duplicadas** do scanner. O `scan-to-input.js` é usado apenas em `entrada.html` e `saida.html`.
- **Conflito potencial:** O campo `codigo_barras` existe tanto na tabela `produtos` (código do produto/fornecedor direto) quanto na tabela `codigos_fornecedores` (vários códigos por produto). O endpoint `buscar_por_codigo.php` consulta ambas, o que é intencional, mas não há priorização clara quando ambos existem para o mesmo código.
- O campo `codigo_barras` de `produtos` não tem restrição UNIQUE, diferentemente de `codigos_fornecedores.codigo_barras` que tem. Isso é inconsistente.

---

## 5. Correções Necessárias (Plano de Ação)

1. **Corrigir cadastro de códigos:** adicionar validação de duplicidade no backend (`cadastrar.php`, `editar.php`), criar índice UNIQUE em `produtos.codigo_barras` (após tratar duplicados existentes), adicionar validação de formato.
2. **Suporte a padrões:** implementar validação de dígito verificador para EAN-8, EAN-13, UPC-A; aceitar Code 128 alfanumérico; preservar zeros à esquerda; armazenar como VARCHAR.
3. **Melhorar captura do scanner:** exclusão de campos interativos, controle de requisições simultâneas, prevenção de leituras duplicadas, estados de scanner, métodos iniciar/pausar/encerrar.
4. **Feedback visual e sonoro:** adicionar sons (sucesso, não encontrado, inválido), indicadores visuais de estado do scanner.
5. **Entrada de estoque:** permitir cadastro de novo lote na tela; garantir confirmação antes de registrar.
6. **Saída de estoque:** implementar FEFO, bloquear lotes vencidos, confirmação do usuário.
7. **Segurança:** manter PDO preparadas, transações, não expor erros internos.
8. **Histórico de leituras:** criar tabela separada de leituras do scanner.
9. **Testes com Playwright:** executar todos os cenários listados.
10. **Documentação:** criar `docs/AUDITORIA_SCANNER.md`, `docs/IMPLEMENTACAO_SCANNER.md`, `docs/TESTES_SCANNER.md`.

---

## 6. Estado do Banco de Dados (verificado em 17/11/2026)

- Tabelas existentes: `usuarios`, `categorias`, `produtos`, `lotes`, `produto_lote`, `movimentacoes`, `codigos_fornecedores`.
- `produtos.codigo_barras`: VARCHAR(50), NULL, índice não-UNIQUE. Alguns produtos têm código, outros NULL.
- `codigos_fornecedores.codigo_barras`: VARCHAR(100), UNIQUE.
- `lotes.codigo_barras_interno`: VARCHAR(50), UNIQUE (permite múltiplos NULL).
- Não há duplicados em `produtos.codigo_barras`.
- Não há duplicados em `codigos_fornecedores.codigo_barras`.
- 2 lotes com código interno gerado: `AG00000001`, `AG00000002`.

---

## 7. Conclusão do Diagnóstico

O sistema tem uma base funcional mas requer correções significativas para ser considerado profissional e confiável. As principais lacunas são: validação de duplicidade no banco, falta de validação de formato de códigos, captura do scanner sem proteção contra leituras simultâneas/duplicadas, ausência de feedback sonoro e visual, e ausência de histórico separado de leituras.

As correções serão implementadas preservando a arquitetura existente (PHP puro, PDO, MariaDB, JavaScript vanilla, Bootstrap 5) e sem reconstruir o projeto do zero.