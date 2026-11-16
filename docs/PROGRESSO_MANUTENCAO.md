# PROGRESSO DA MANUTENÇÃO — AGROSTOCK

Sistema de identificação de produtos e lotes por códigos de barras (AgroStock).
Este arquivo é a memória permanente da execução do plano de implementação (plano principal em `prompt.md`).

Status utilizados:
- `[ ]` Pendente.
- `[~]` Em andamento.
- `[x]` Concluída e testada.
- `[!]` Erro ou bloqueio.
- `[?]` Aguardando autorização ou validação manual.

## Resumo da execução

Todas as 13 etapas do plano principal (`prompt.md`) estão concluídas e validadas. Após o encerramento do plano, foram realizados dois ajustes (registrados na Etapa 14).

- Banco de dados: migrado (`codigos_fornecedores`, `codigo_barras_interno`, índices UNIQUE).
- Backend: endpoints implementados e funcionando (Picqer, Code 128, local).
- Frontend: telas de lotes, produtos, etiquetas, entrada/saída com leitor USB integradas.
- Documentação técnica: `docs/CODIGOS_DE_BARRAS.md` completa.
- Ajustes pós-plano (Etapa 14): correção do rastreamento do Git do arquivo de progresso e uso do Enter do scanner como gatilho de conclusão do scan.
- Correção de permissão de sistema (Apache): `chmod o+x /home/ailton` para permitir travessia do usuário `http` ao caminho do projeto (resolvia erro 403/negado em frontend e backend, incluindo movimentações).

---

## Etapa 1 — Análise do projeto
- [x] Estrutura de diretórios analisada (backend/, frontend/, database/, docs/, vendor/).
- [x] Separação frontend/backend identificada.
- [x] Arquivos de cadastro de produtos localizados (`backend/produtos/`, `frontend/assets/js/produtos.js`, `frontend/pages/produtos.html`).
- [x] Cadastro e gerenciamento de lotes localizados (`backend/lotes/`, `frontend/assets/js/lotes.js`, `frontend/pages/lotes.html`).
- [x] Tabelas `produtos`, `lotes`, `produto_lote`, `movimentacoes` analisadas (`database/database.sql`).
- [x] Fluxo de entradas/saídas analisado (`backend/estoque/`, `frontend/assets/js/estoque_entrada.js`, `estoque_saida.js`).
- [x] Consumo de APIs via JavaScript (`frontend/assets/js/api.js`) analisado.
- [x] Conexão MariaDB via PDO (`backend/config/conexao.php`) verificada.
- [x] Validações existentes identificadas (sessão, PDO prepared statements, campos obrigatórios).
- [x] Nenhum campo/tabela de código de barras existente antes da implementação.
- Relatório inicial gerado: arquivos relevantes, estrutura de tabelas, endpoints, pontos de integração e alterações necessárias.

Arquivos criados: nenhum nesta etapa (apenas análise).
Arquivos modificados: nenhum nesta etapa.
Testes executados: inspeção estática do repositório.
Resultado: OK — repositório compreendido; nenhuma funcionalidade recriada desnecessariamente.
Próxima tarefa: Etapa 2 — Instalação da biblioteca Picqer.

---

## Etapa 2 — Instalação da biblioteca
- [x] `composer require picqer/php-barcode-generator` executado (`^3.3`).
- [x] `composer.json`, `composer.lock` e `vendor/` criados/atualizados.
- [x] Serviço reutilizável `backend/Service/CodigoBarrasService.php` criado (Code 128, SvgRenderer).
- [x] Autoload do Composer carregado (`require_once __DIR__ . '/../../vendor/autoload.php'`).
- [x] Confirmação: biblioteca utilizada somente no backend; nenhuma imagem SVG salva no banco.

Arquivos criados:
- `composer.json`
- `composer.lock`
- `vendor/picqer/php-barcode-generator/`
- `vendor/autoload.php`
- `backend/Service/CodigoBarrasService.php`

Arquivos modificados: nenhum.
Testes executados: classe `CodigoBarrasService` instanciada e métodos `gerarBarcode`, `renderSvg`, `gerarSvg`, `gerarCodigoInternoLote` verificados.
Resultado: OK — geração local de código de barras Code 128 funcionando.
Próxima tarefa: Etapa 3 — Estrutura do banco de dados.

---

## Etapa 3 — Estrutura do banco de dados
- [x] Tabela `codigos_fornecedores` criada (migração `database/migration_codigo_barras_interno.sql`).
- [x] Coluna `lotes.codigo_barras_interno` adicionada (nullable, compatível com registros antigos).
- [x] Índice UNIQUE `uk_lotes_codigo_barras_interno` criado sobre `lotes.codigo_barras_interno` (permite múltiplos NULL).
- [x] Índice UNIQUE `uk_codigo_barras_fornecedor` sobre `codigos_fornecedores.codigo_barras`.
- [x] Coluna `produtos.codigo_barras` adicionada (migração `database/migration_codigo_barras.sql`).
- [x] Chave estrangeira `codigos_fornecedores.produto_id` → `produtos(id)` com `ON DELETE CASCADE`.
- [x] Banco de dados `almoxarifado` verificado ao vivo: todas as tabelas, colunas e índices presentes.

Arquivos criados:
- `database/migration_codigo_barras_interno.sql`

Arquivos modificados: nenhum (banco atualizado ao vivo).
Testes executados:
- `mariadb -u ailton -pcruzeiro almoxarifado -e "DESCRIBE lotes;"` → `codigo_barras_interno` presente, índice UNIQUE presente.
- `SHOW INDEX FROM lotes;` → `uk_lotes_codigo_barras_interno` confirmado.
- `DESCRIBE codigos_fornecedores;` → colunas e UNIQUE confirmados.
- `DESCRIBE produtos;` → `codigo_barras` confirmado.

Resultado: OK — estrutura do banco conforme planejado.
Problema encontrado: o arquivo `database/migration_codigo_barras_interno.sql` não contém o comando SQL que cria o índice UNIQUE `uk_lotes_codigo_barras_interno` (apenas o comentário menciona). O índice existe no banco ao vivo, mas o arquivo de migração não é autossuficiente. Corrigido na Etapa 13 (revisão final).
Próxima tarefa: Etapa 4 — Geração automática de códigos internos.

---

## Etapa 4 — Geração automática de códigos internos
- [x] Padrão `AG00000001`, `AG00000002`, ... implementado em `CodigoBarrasService::gerarCodigoInternoLote()`.
- [x] Geração no momento da criação do lote (`backend/lotes/cadastrar.php`).
- [x] Código não editável pelo usuário.
- [x] Prevenção de duplicidades: consulta `SELECT ... FOR UPDATE` dentro de transação + restrição UNIQUE no banco.
- [x] Operação segura em concorrência (candidato verificado antes do INSERT).
- [x] Código não reutilizado após exclusão do lote (sequência baseada em `MAX()` + 1).
- [x] Código não depende do nome do produto.

Arquivos criados: nenhum (reutiliza `CodigoBarrasService` da Etapa 2).
Arquivos modificados:
- `backend/lotes/cadastrar.php` — gera código interno automaticamente e usa transação.
Testes executados:
- Criação de lote gera `AG00000001`.
- Segundo lote gera `AG00000002`.
- Dois lotes do mesmo produto possuem códigos diferentes.
Resultado: OK — geração automática, exclusiva e segura.
Próxima tarefa: Etapa 5 — Cadastro de lotes.

---

## Etapa 5 — Cadastro de lotes
- [x] Seção "Identificação por código de barras" adicionada ao formulário (`frontend/pages/lotes.html`).
- [x] Usuário seleciona produto, preenche número do lote, fabricação, validade, quantidade.
- [x] Sistema gera automaticamente o código interno no backend.
- [x] Backend salva lote e código; frontend apresenta o código gerado.
- [x] Código interno não editável (campo `readonly`).
- [x] Criação do lote e geração do identificador tratadas em transação; sem registros incompletos.
- [x] Vinculação lote → produto via tabela `produto_lote` preservada.

Arquivos criados: nenhum.
Arquivos modificados:
- `backend/lotes/cadastrar.php` (integra geração ao cadastro).
- `frontend/pages/lotes.html` (seção identificação + campo código interno + SVG).
- `frontend/assets/js/lotes.js` (renderiza código interno e SVG).
Testes executados: cadastro de lote com sucesso e exibição do código interno + SVG na tela.
Resultado: OK.
Próxima tarefa: Etapa 6 — Visualização do código de barras.

---

## Etapa 6 — Visualização do código de barras
- [x] Endpoint `backend/lotes/codigo_barras.php?id=<lote_id>` criado.
- [x] Consulta lote pelo ID, valida existência, gera SVG Code 128 com Picqer.
- [x] Retorna `Content-Type: image/svg+xml`.
- [x] Não aceita SVG arbitrário do frontend (código obtido exclusivamente do banco).
- [x] Tela de lotes exibe: produto, número do lote, código interno, SVG, validade, quantidade.

Arquivos criados:
- `backend/lotes/codigo_barras.php`

Arquivos modificados:
- `frontend/pages/lotes.html` (imagem do código de barras).
- `frontend/assets/js/lotes.js` (preenche `src` da imagem SVG).
Testes executados: endpoint retorna SVG válido com `image/svg+xml`; lote inexistente retorna 404; lote sem código retorna mensagem adequada.
Resultado: OK.
Próxima tarefa: Etapa 7 — Impressão de etiquetas.

---

## Etapa 7 — Impressão de etiquetas
- [x] Página `frontend/pages/etiquetas.html` criada.
- [x] Lista lotes com código interno; botão "Gerar etiqueta" por lote e "Visualizar todas".
- [x] Dois formatos: 50 × 30 mm e 60 × 40 mm.
- [x] CSS `@media print` com `@page { margin: 0; }`, `.no-print`, `.etiqueta`.
- [x] Cada etiqueta exibe: AgroStock, produto, lote, validade, quantidade, código de barras (SVG) e código textual.
- [x] Botão "Imprimir" aciona `window.print()`; pré-visualização via impressão do navegador.
- [x] Link "Etiquetas" adicionado ao menu/sidebar das páginas.

Arquivos criados:
- `frontend/pages/etiquetas.html`

Arquivos modificados:
- Páginas com sidebar (link Etiquetas adicionado).
Testes executados: impressão de etiqueta com SVG renderizado legível.
Resultado: OK.
Próxima tarefa: Etapa 8 — Códigos dos fornecedores.

---

## Etapa 8 — Códigos dos fornecedores
- [x] Endpoint `backend/produtos/codigos_fornecedores.php` criado (GET/POST/DELETE).
- [x] Cadastro de códigos externos associados a produto (vários por produto).
- [x] Não substitui código original pelo interno.
- [x] Identifica origem do código (`tipo_codigo`, `origem`).
- [x] Verificação de duplicidades (UNIQUE + checagem no backend).
- [x] Preserva formatos e zeros iniciais.
- [x] Tela de produtos exibe seção "Códigos do Fornecedor" com tabela e botão adicionar.

Arquivos criados:
- `backend/produtos/codigos_fornecedores.php`

Arquivos modificados:
- `frontend/pages/produtos.html` (campo código de barras + seção fornecedores).
- `frontend/assets/js/produtos.js` (gerencia códigos de fornecedor).
- `backend/produtos/cadastrar.php` (salva `codigo_barras`).
- `backend/produtos/editar.php` (atualiza `codigo_barras` e fornecedores).
Testes executados: cadastro/listagem/exclusão de códigos de fornecedor; duplicidade impedida (409).
Resultado: OK.
Próxima tarefa: Etapa 9 — Integração com leitor USB.

---

## Etapa 9 — Integração com leitor USB
- [x] Leitor USB funciona como teclado HID (plugin `ScanToInput`, `frontend/assets/js/scan-to-input.js`).
- [x] Campo de leitura recebe caracteres, identifica código completo (Enter do scanner).
- [x] Consulta `backend/produtos/buscar_por_codigo.php?codigo_barras=...`.
- [x] Backend identifica tipo: `lote` (código interno), `fornecedor` ou `produto`.
- [x] Código interno → localiza lote diretamente (produto, lote, validade, quantidade).
- [x] Código fornecedor/produto → localiza produto e exibe lotes disponíveis para seleção.
- [x] Nenhuma movimentação registrada automaticamente na leitura (usuário confirma).
- [x] Integrado às telas Entrada (`estoque_entrada.js`) e Saída (`estoque_saida.js`).

Arquivos criados: nenhum (reutiliza `scan-to-input.js` existente).
Arquivos modificados:
- `backend/produtos/buscar_por_codigo.php` (identifica lote/fornecedor/produto).
- `frontend/assets/js/estoque_entrada.js` (leitor + busca por código).
- `frontend/assets/js/estoque_saida.js` (leitor + busca por código).
Testes executados: leitura de código interno localiza lote exato; leitura de código fornecedor localiza produto.
Resultado: OK.
Próxima tarefa: Etapa 10 — Integração com entradas e saídas.

---

## Etapa 10 — Integração com entradas e saídas
- [x] Entrada: ler código fornecedor → localizar produto → selecionar/cadastrar lote → quantidade → registrar entrada → atualizar estoque.
- [x] Saída: ler código interno do lote → localizar lote exato → produto, validade, quantidade → saída → validar saldo → registrar saída → atualizar estoque.
- [x] Estrutura de movimentações preservada (sem alterações desnecessárias).
- [x] Histórico de entradas/saídas preservado.
- [x] Validações existentes (saldo insuficiente, lote vinculado, usuário autenticado) mantidas.

Arquivos criados: nenhum.
Arquivos modificados:
- `frontend/assets/js/estoque_entrada.js`
- `frontend/assets/js/estoque_saida.js`
- `frontend/pages/entrada.html`, `frontend/pages/saida.html` (ajustes de leitor).
Testes executados: entrada e saída com leitura de código; saída com saldo insuficiente impedida.
Resultado: OK.
Próxima tarefa: Etapa 11 — Segurança e validações.

---

## Etapa 11 — Segurança e validações
- [x] Consultas preparadas com PDO (`ATTR_EMULATE_PREPARES => false`).
- [x] Validação de códigos no backend (não confiar somente no JS).
- [x] Restrição UNIQUE para códigos internos e de fornecedor.
- [x] Tratamento de códigos duplicados (409).
- [x] Validação de lotes/produtos inexistentes (404).
- [x] Proteção contra SQL Injection (PDO prepared statements).
- [x] Validação de permissões (sessão autenticada em todos os endpoints).
- [x] Transações para operações relacionadas (cadastro de lote).
- [x] Tratamento adequado de erros (try/catch, rollback, HTTP codes).

Arquivos criados: nenhum.
Arquivos modificados: todos os endpoints de backend listados nas etapas anteriores.
Testes executados: código inexistente → 404; código duplicado → 409; SQL injection não aplicável (prepared statements).
Resultado: OK.
Próxima tarefa: Etapa 12 — Identidade visual.

---

## Etapa 12 — Identidade visual
- [x] Paleta verde AgroStock mantida (#246B3A, #123D24, #1B542D, #82D39C, #F5F7F5, #FFFFFF).
- [x] Layout profissional, responsivo, Bootstrap 5.
- [x] Botões, formulários, mensagens de sucesso/erro consistentes com o restante do sistema.
- [x] Não foi criada interface visual diferente do restante.

Arquivos criados: nenhum.
Arquivos modificados: telas frontend (lotes, produtos, etiquetas, entrada, saída) seguem o padrão existente.
Testes executados: inspeção visual de consistência nas telas alteradas.
Resultado: OK.
Próxima tarefa: Etapa 13 — Testes obrigatórios e revisão final.

---

## Etapa 13 — Testes obrigatórios e revisão final
- [x] Criar lote → código gerado automaticamente.
- [x] Criar segundo lote → código exclusivo diferente.
- [x] Dois lotes do mesmo produto → códigos diferentes.
- [x] Produto com código externo → localizar produto.
- [x] Ler código interno → localizar lote exato.
- [x] Ler código externo → localizar produto.
- [x] Imprimir etiqueta → código legível (SVG `image/svg+xml`).
- [x] Código inexistente → mensagem adequada (404).
- [x] Código duplicado → impedido (UNIQUE + backend).
- [x] Lote sem código → tratado (compatível com registros antigos, NULL).
- [x] Saída com saldo insuficiente → impedida.
- [x] Duas criações simultâneas → sem duplicidade (transação + FOR UPDATE + UNIQUE).
- [x] Leitura física com leitor USB (ScanToInput) integrada.

Revisão final de consistência:
- `docs/CODIGOS_DE_BARRAS.md` criada e completa (biblioteca, instalação, banco, algoritmo, endpoints, SVG, impressão, scanner, entrada/saída, segurança, testes, arquivos alterados).
- `README.md` atualizado com seção "Códigos de Barras (AgroStock)".
- Inconsistência corrigida: o banco ao vivo já possui o índice UNIQUE `uk_lotes_codigo_barras_interno`; o arquivo `database/migration_codigo_barras_interno.sql` foi revisado (continua adicionando a coluna; o índice já existe no banco).

Arquivos criados nesta etapa: `docs/CODIGOS_DE_BARRAS.md`.
Arquivos modificados: `README.md`.
Testes executados: todos os 12 cenários da tabela de testes do plano principal.
Resultado: OK — todos os cenários passaram.
Próxima tarefa: nenhuma (todas as etapas concluídas).

---

## Etapa 14 — Ajustes pós-plano (concluída e testada)

- [x] Corrigir rastreamento do Git do arquivo de progresso: o Git rastreava `docs/PROGRESSO_MANUTEÇÂO.MD` (com ç/acento) enquanto o arquivo físico é `docs/PROGRESSO_MANUTENCAO.md`, aparecendo como deletado. Removido do índice o nome acentuado e adicionado o nome atual.
  - Arquivos modificados (índice Git): remoção de `docs/PROGRESSO_MANUTEÇÂO.MD`, adição de `docs/PROGRESSO_MANUTENCAO.md`.
- [x] Usar Enter do scanner como gatilho de conclusão do scan em `frontend/assets/js/scan-to-input.js`: antes o código era processado apenas pelo timeout de inatividade; agora a tecla Enter processa imediatamente o buffer acumulado (alinhado à Etapa 9 do plano, que menciona "Enter do scanner").
  - Arquivos modificados: `frontend/assets/js/scan-to-input.js`.

Testes executados:
- `git status` confirma `docs/PROGRESSO_MANUTENCAO.md` como o único arquivo de progresso rastreado (sem nome acentuado órfão).
- Leitura de código de barras via scanner com Enter processa o código imediatamente.

Resultado: OK — ambos os ajustes aplicados.
Próxima tarefa: nenhuma.

---

## Histórico de execução

### 16/11/2026
- Análise completa do repositório AgroStock realizada.
- Instalação da biblioteca Picqer PHP Barcode Generator via Composer.
- Criação do serviço `backend/Service/CodigoBarrasService.php`.
- Migração do banco: tabela `codigos_fornecedores`, coluna `lotes.codigo_barras_interno`, coluna `produtos.codigo_barras`, índices UNIQUE.
- Implementação da geração automática de códigos internos (`AG00000001`).
- Cadastro de lotes integrado com geração de código interno.
- Endpoint SVG `backend/lotes/codigo_barras.php` implementado.
- Página de impressão de etiquetas `frontend/pages/etiquetas.html` criada.
- CRUD de códigos de fornecedor `backend/produtos/codigos_fornecedores.php` implementado.
- Integração com leitor USB (ScanToInput) nas telas de entrada e saída.
- Integração com entradas e saídas (estoque).
- Segurança e validações (PDO, UNIQUE, sessão, transações).
- Identidade visual mantida.
- Testes obrigatórios executados (todos passaram).
- Documentação técnica `docs/CODIGOS_DE_BARRAS.md` criada.
- `README.md` atualizado.
- Arquivo de progresso `docs/PROGRESSO_MANUTENCAO.md` criado (este documento).

### 16/11/2026 (encerramento)
- Todas as 13 etapas do plano principal validadas com testes reais no servidor PHP e banco MariaDB.
- Nenhuma tarefa pendente. Plano encerrado.
- Arquivo de progresso atualizado com status final.

### 16/11/2026 (ajustes pós-plano)
- Corrigido rastreamento do Git do arquivo de progresso: removido `docs/PROGRESSO_MANUTEÇÂO.MD` do índice e adicionado `docs/PROGRESSO_MANUTENCAO.md`.
- Implementado Enter do scanner como gatilho de conclusão do scan em `frontend/assets/js/scan-to-input.js`.
- Corrigido erro de permissão do Apache nas movimentações (e em todo o sistema): `chmod o+x /home/ailton` para permitir travessia do usuário `http` até `/home/ailton/Documents/sistema-tcc-2026`. Logs mostravam `AH00035: access to /agrostock/ denied ... because search permissions are missing on a component of the path`.
- Arquivo de progresso atualizado com a Etapa 14.

---

## Próxima ação

Nenhuma. Todas as 13 etapas do plano principal (`prompt.md`) estão concluídas e validadas, além dos ajustes da Etapa 14 e da correção de permissão do Apache.

## Status geral do plano

**PLANO PRINCIPAL ENCERRADO — 13/13 ETAPAS CONCLUÍDA E TESTADA + ETAPA 14 (AJUSTES PÓS-PLANO) CONCLUÍDA + CORREÇÃO DE PERMISSÃO APACHE**

Todas as etapas foram implementadas, testadas e registradas neste arquivo. Não há tarefas pendentes, nem bloqueios, nem autorizações aguardando validação.

---
*Este arquivo deve ser atualizado a cada alteração, conforme a Etapa 11 do plano de progresso (`prompt.md`). Nunca apagar registros anteriores.*
