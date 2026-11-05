# Diagnóstico Geral do Sistema — AgroStock

Data: 10/10/2026
Escopo: revisão estática de `backend/` (PHP 8 + PDO), `frontend/` (HTML/JS/Bootstrap/Chart.js) e `database/`.
Objetivo: mapear erros que comprometem a experiência do usuário, segurança e consistência dos dados, além de sugerir melhorias. Nenhuma alteração de código foi realizada.

Legenda de severidade:
- **Alta**: quebra funcionalidade principal, perda/inconsistência de dados ou falha de segurança relevante.
- **Média**: comportamento incorreto em cenários comuns, má experiência ou risco moderado.
- **Baixa**: polimento, manutenibilidade e casos de borda.

---

## 1. Erros funcionais (bugs)

### 1.1 `produtos/excluir.php` — exclusão forçada falha com movimentações vinculadas — ALTA
`backend/produtos/excluir.php:68-78`: quando `forcar=true`, o código apaga `produto_lote` e o produto, mas **não** remove `movimentacoes`. Como a FK `fk_movimentacoes_produto` é `ON DELETE RESTRICT` (`database/database.sql:87`), o `DELETE FROM produtos` lança exceção e o endpoint retorna 500.
- Hoje é latente porque o frontend nunca envia `forcar`, mas o endpoint está quebrado nesse caminho.
- Melhoria: bloquear a exclusão física quando houver movimentações (retornar 409 explicativo) ou excluir/anonimizar as movimentações dentro da mesma transação. Remover a opção `forcar` se não for usada.

### 1.2 Comparação estrita de `id` ao editar — ALTA (intermitente)
`frontend/assets/js/usuarios.js:75`, `lotes.js:140` e `categorias.js:60` usam `x.id === id`. Se o driver PDO devolver `id` como string (varia por versão/configuração), o `find` não encontra e o modal de edição abre vazio ou não abre, sem mensagem de erro.
- `produtos.js:110` já faz certo: `Number(p.id) === Number(id)`.
- Melhoria: padronizar todas as buscas com `Number(...)`.

### 1.3 Entrada/saída de estoque não alertam sobre lote vencido — ALTA
`backend/estoque/entrada.php:53-59` possui um bloco condicional vazio (`// Apenas aviso, não bloqueia`) que nunca gera aviso. O frontend também não destaca lotes vencidos no select. Resultado: é possível dar entrada ou retirar produtos de lotes vencidos sem qualquer feedback, contrariando o propósito de controle de validade do sistema.
- Melhoria: retornar um campo de aviso na resposta e/ou bloquear saída de lote vencido; destacar visualmente lotes vencidos/próximos no `<select>`.

### 1.4 `lotes/editar.php` pode reatribuir vínculo indevidamente — MÉDIA
`backend/lotes/editar.php:94-120`: se o produto selecionado não tem vínculo com o lote, o código busca o primeiro vínculo existente (`ORDER BY id LIMIT 1`) e altera o `produto_id`. Em um lote compartilhado por vários produtos, isso "rouba" o vínculo de outro produto de forma silenciosa.
- Melhoria: editar apenas o vínculo `(produto_id, lote_id)` correspondente; tratar explicitamente o caso "vínculo inexistente".

### 1.5 `lotes/listar.php` não lista lotes sem vínculo — MÉDIA
`backend/lotes/listar.php:30-32` usa `INNER JOIN produto_lote`. Lotes cadastrados e ainda não vinculados a produto simplesmente não aparecem na tela de Lotes, embora existam no banco.
- Melhoria: usar `LEFT JOIN` ou criar um endpoint que liste lotes e seus vínculos.

### 1.6 `dados_teste.sql` deixa estoque e histórico inconsistentes — MÉDIA
`database/dados_teste.sql:44-54`: as movimentações de `saida` são inseridas sem subtrair de `produto_lote`. O estoque exibido (relatório/dashboard) fica maior que o histórico real de movimentações. Isso confunde a demonstração e testes.
- Melhoria: ajustar as quantidades de `produto_lote` de acordo com as saídas, ou gerar os dados via scripts de entrada/saída.

### 1.7 Botão "Limpar" (type=reset) deixa estado inconsistente — MÉDIA
Em `frontend/pages/entrada.html:91` e `saida.html:91`, o botão `type="reset"` reseta o formulário, mas não reabilita/limpa o `<select>` de lote nem os campos `quantidade_disponivel` e `validade_lote`. Após um envio bem-sucedido o select fica `disabled` e o reset não o restaura.
- Melhoria: tratar o reset via JS, limpando selects dependentes e redefinindo o estado.

### 1.8 `data_validade.min` "gruda" ao editar lote vencido — BAIXA
`frontend/assets/js/lotes.js:130` define `data_validade.min = hoje` ao abrir "Novo Lote". Se o usuário abrir "Novo" e depois editar um lote já vencido, o navegador invalida o campo (data < min) e bloqueia o salvamento.
- Melhoria: definir `min` apenas no modo cadastro e limpar no modo edição.

### 1.9 Código morto em `relatorios/estoque.php` — BAIXA
`backend/relatorios/estoque.php:45-59`: `$sqlResumo` é montada e nunca executada (o resumo é calculado em PHP logo abaixo). Se executada, a query com `SUM` aninhado em `CASE` seria inválida.
- Melhoria: remover o bloco.

### 1.10 Datas inválidas silenciosas nos relatórios — BAIXA
`backend/relatorios/movimentacoes.php` e `estoque/movimentacoes.php` recebem `data_inicio`/`data_fim` sem validação de formato. A query é parametrizada (sem injeção), mas datas inválidas retornam resultados vazios sem explicar o motivo.
- Melhoria: validar com `DateTime::createFromFormat('Y-m-d', ...)` e retornar 422.

---

## 2. Segurança

### 2.1 XSS armazenado em todas as listagens — ALTA
Todos os arquivos JS montam HTML com `innerHTML` interpolando dados do banco sem escape: `produtos.js`, `categorias.js`, `lotes.js`, `usuarios.js`, `estoque_movimentacoes.js`, `alertas.js`, `relatorios.js`, `dashboard.js`. Campos como `nome`, `descricao`, `observacao` são controlados pelo usuário.
- Exemplo: um produto chamado `<img src=x onerror=alert(document.cookie)>` executa script para todos que abrirem a lista.
- Melhoria: escapar dados (função `escapeHtml`) ou usar `textContent`/criação de nós DOM em vez de `innerHTML`.

### 2.2 Injeção em atributos inline `onclick` — ALTA
Chamadas como `onclick="excluirProduto(${p.id}, '${p.nome}')"` (`produtos.js:86`, `categorias.js:36`, `lotes.js:115`, `usuarios.js:44`) quebram com apóstrofo no nome e permitem injeção de JS.
- Melhoria: usar `addEventListener`/`dataset` com os IDs e valores escapados.

### 2.3 Ausência de proteção CSRF — MÉDIA
Todos os endpoints de escrita (POST) confiam apenas na sessão, sem token CSRF. Um site externo pode disparar ações autenticadas.
- Melhoria: gerar token CSRF na sessão e validá-lo em todo POST; incluir no `apiFetch`.

### 2.4 Login sem limite de tentativas — MÉDIA
`backend/auth/login.php` não limita tentativas por usuário/IP, permitindo força bruta.
- Melhoria: contador de tentativas com bloqueio temporário ou atraso progressivo.

### 2.5 Credenciais e URL hardcoded, versionadas — MÉDIA
`backend/config/conexao.php:12-16` usa `root` com senha vazia; `backend/config/config.php:12` fixa `API_BASE_URL` em `http://localhost/sistema-tcc-2026/backend`. O `.gitignore` está vazio.
- `database/database.sql:110` semeia o usuário `admin` com senha `admin123`.
- Melhoria: usar variáveis de ambiente/arquivo de config não versionado, preencher `.gitignore` e exigir troca da senha inicial.

### 2.6 Cookie de sessão sem `Secure` — BAIXA
`config.php` define `httponly`, `use_strict_mode` e `samesite=Lax`, mas não `cookie_secure` (aceitável em HTTP local, mas deve ser habilitado em produção).
- Melhoria: definir `session.cookie_secure` quando servido via HTTPS.

### 2.7 Backend sem `.htaccess` — BAIXA
Não há `.htaccess` protegendo `backend/`. Configs e endpoints ficam expostos conforme a configuração do servidor.
- Melhoria: adicionar regras para negar acesso direto a `config/` e a listagem de diretórios.

---

## 3. Experiência do usuário (UX)

### 3.1 Primeiro usuário é criado como "operador" — ALTA
`frontend/criar-login/criar_usuario.php:25` fixa `nivel_acesso = 'operador'` e `criar_login.html:52` só oferece "Operador". Em uma instalação limpa (sem os seeds do `database.sql`), o sistema nasce **sem nenhum administrador**, impossibilitando gerenciar usuários.
- Melhoria: criar o primeiro usuário como `admin` e permitir promover/editar depois.

### 3.2 Menu "Usuários" visível para operadores — MÉDIA
O item aparece em todas as páginas. Operadores acessam, recebem 403 e veem apenas a lista vazia ("Nenhum usuário encontrado"), sem explicação.
- Melhoria: esconder itens restritos com base em `nivel_acesso` (guardado no `sessionStorage`) e exibir mensagem clara de "sem permissão".

### 3.3 Erros de carregamento só vão para o console — MÉDIA
`dashboard.js:24-53`, `produtos.js:90`, `categorias.js:40`, entre outros, tratam falhas com `console.error`. O usuário final vê "Nenhum ... encontrado" ou tela de "Carregando..." eterna, sem saber que houve erro.
- Melhoria: exibir toast de erro e/ou estado visual de falha com botão "Tentar novamente".

### 3.4 `api.js` marca respostas não-JSON como sucesso — MÉDIA
`frontend/assets/js/api.js:72-74`: se a resposta vem vazia/não-JSON com status 200, `data.sucesso` vira `true`, e a tela pode renderizar conteúdo vazio como se tudo estivesse certo.
- Melhoria: considerar falha quando o corpo não for um JSON válido mesmo em 200.

### 3.5 Dashboard não exibe o card "Vencidos" — BAIXA
A API retorna `estatisticas.vencidos` (`backend/dashboard.php:166`), mas `dashboard.html` não possui o card. Há espaço para um 5º indicador.
- Melhoria: adicionar o card de vencidos (destaque vermelho).

### 3.6 `confirm()` nativo para exclusões — BAIXA
Todas as exclusões usam `window.confirm` (`produtos.js:176`, `categorias.js:120`, `lotes.js:203`, `usuarios.js:146`), inconsistente com os toasts do restante da UI.
- Melhoria: usar modal de confirmação no padrão Bootstrap.

### 3.7 Login com `action` nativo como fallback exibe JSON cru — BAIXA
`frontend/pages/index.html:23` aponta `action="../../backend/auth/login.php"`. Se o JS não carregar, o POST nativo mostra o JSON de resposta na tela.
- Melhoria: remover o `action`/tratar erro visivelmente, ou prover fallback amigável.

### 3.8 Sem paginação/ordenação em listas principais — BAIXA
Produtos, categorias, lotes e usuários carregam todos os registros de uma vez e sem ordenação por coluna. Tende a degradar com o crescimento dos dados.
- Melhoria: paginação no servidor e ordenação por coluna.

### 3.9 Regra dos 30 dias duplicada e hardcoded no frontend — BAIXA
`lotes.js:71-72`, `alertas.js` (texto) e `config.php:25` (`DIAS_ALERTA_VALIDADE`) mantêm o mesmo limite em lugares diferentes. Alterar a regra no backend não reflete no filtro de lotes do frontend.
- Melhoria: expor `dias_alerta` da API e reutilizá-lo no frontend.

---

## 4. Manutenibilidade / estrutura

### 4.1 Duplicação de utilitários no frontend — MÉDIA
`mostrarToast`, `criarToastContainer`, `logout` e `formatarData*` estão copiados em cerca de 10 arquivos JS. Qualquer correção precisa ser feita em vários lugares.
- Melhoria: extrair para um `utils.js` compartilhado (carregado junto de `api.js`).

### 4.2 Arquivos legados e nomes problemáticos — BAIXA
- `frontend/padrão/cabecalho.html` contém `<?php echo $titulo_pagina; ?>` e nunca é incluído (arquivo morto). O nome da pasta "padrão" com acento pode causar problemas em alguns servidores/URLs.
- `frontend/dashboard.html` e `frontend/index.html` são apenas redirecionadores; poderiam ser resolvidos com `.htaccess`/configuração.
- `backend/config/config.php:12` define `API_BASE_URL` que não é usada em lugar algum.

### 4.3 `.gitignore` vazio — BAIXA
Todos os arquivos (incluindo possíveis configs locais e assets de IDE) tendem a ser versionados.
- Melhoria: ignorar configs locais, `vendor/`, arquivos de editor e logs.

### 4.4 README desatualizado em relação ao ambiente — BAIXA
O README descreve instalação no Windows/Laragon (`backend/config/conexao.php`, caminhos de Apache), enquanto o repositório é mantido em Linux. Também não menciona a necessidade de um usuário `admin`.
- Melhoria: documentar setup multiplataforma e o passo de criação/promoção do administrador.

---

## 5. Resumo priorizado (sugestão de ordem de correção)

| # | Item | Severidade | Impacto |
|---|------|-----------|---------|
| 2.1 | XSS armazenado nas listagens | Alta | Execução de script por dados do banco |
| 2.2 | Injeção em `onclick` inline | Alta | Quebra de UI e injeção de JS |
| 3.1 | Primeiro usuário sem admin | Alta | Sistema inutilizável em instalação limpa |
| 1.1 | Exclusão forçada de produto | Alta | Erro 500 / dados órfãos |
| 1.2 | `id === id` na edição | Alta | Edição não abre silenciosamente |
| 1.3 | Lote vencido sem aviso | Alta | Controle de validade ineficaz |
| 1.6 | Estoque x movimentações inconsistentes | Média | Dados de demonstração errados |
| 1.4 | Reatribuição de vínculo no lote | Média | Perda de associação |
| 1.5 | Lotes sem vínculo não listados | Média | Dados invisíveis |
| 2.3 | Sem CSRF | Média | Ações forjadas |
| 2.4 | Login sem rate limit | Média | Força bruta |
| 2.5 | Credenciais versionadas | Média | Exposição de acesso |
| 3.2 | Menu Usuários para operador | Média | Acesso indevido/erro confuso |
| 3.3 | Erros apenas no console | Média | Usuário sem feedback |
| 3.4 | `api.js` trata não-JSON como sucesso | Média | Falhas silenciosas |
| 4.1 | Utilitários duplicados | Média | Manutenção cara |
| 1.7 | Reset de formulário inconsistente | Média | Estado de tela errado |
| 1.8–1.10, 3.5–3.9, 4.2–4.4 | Diversos | Baixa | Polimento e robustez |

---

## 6. Observações finais
- Os endpoints usam PDO com prepared statements e transações na maioria dos fluxos de escrita — a base é boa; os maiores riscos estão no frontend (XSS/atributos inline) e em casos de borda não tratados.
- Não foi possível executar `php -l`/testes (PHP não instalado no ambiente desta análise). Recomenda-se rodar a verificação de sintaxe e um teste manual dos fluxos de entrada/saída/edição após cada correção.
- Nenhum arquivo de código foi alterado nesta etapa.
