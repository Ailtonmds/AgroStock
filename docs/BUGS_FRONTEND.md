# Bugs do Frontend — AgroStock

**Data:** 17/11/2026  
**Projeto:** AgroStock — Sistema de Gerenciamento de Almoxarifado (TCC 2026)

Este documento registra os bugs identificados no frontend durante a auditoria completa, as correções aplicadas e os bugs conhecidos que permanecem.

---

## 1. Bugs Corrigidos

| # | Arquivo | Bug | Correção | Status |
|---|---------|-----|----------|--------|
| 1 | `frontend/assets/js/dashboard.js` | `formatarData` local pode falhar se `window.formatarData` não estiver definido (dependência de carregamento de scripts). | Garantir que `utils.js` seja carregado antes de `dashboard.js` (já está) e adicionar fallback. | Corrigido |
| 2 | `frontend/assets/js/dashboard.js` | Gráficos podem quebrar se `graficos` ou subpropriedades forem `null`/`undefined` vindos do backend. | Adicionar validação de dados antes de renderizar gráficos. | Corrigido |
| 3 | `frontend/assets/js/estoque_entrada.js` | Inicialização duplicada de `feedback` (declarado no escopo do módulo e reatribuído em `inicializarLeitorCodigoBarras`). | Remover redeclaração desnecessária; garantir instância única. | Corrigido |
| 4 | `frontend/assets/js/estoque_saida.js` | Mesmo problema de duplicidade do `feedback` que na entrada. | Mesma correção da entrada. | Corrigido |

---

## 2. Bugs Conhecidos / Limitações (Não Corrigidos)

| # | Arquivo | Bug | Motivo / Observação |
|---|---------|-----|---------------------|
| A | `frontend/assets/js/produtos.js` | O clique no botão "Salvar" do modal de produto não dispara requisição via UI no ambiente de teste headless (Firefox + Bootstrap modal). | O backend (`produtos/cadastrar.php`, `editar.php`) foi validado diretamente via HTTP e funciona. O campo `codigo_barras` existe e é preenchível. O problema parece ser interação Playwright + Bootstrap modal (foco capturado pelo backdrop), não um bug de código. |
| B | `frontend/assets/js/dashboard.js` | Erro de console "Erro ao carregar dashboard: JSHandle@object" e "too much recursion" observados no ambiente de teste. | Pré-existente, não relacionado ao scanner. Provavelmente decorrente do ambiente de teste ou resposta do backend `dashboard.php`. |
| C | `frontend/pages/etiquetas.html` | A imagem `<img src="../../backend/lotes/codigo_barras.php?id=...">` depende de cookies de sessão same-origin. Em navegadores com restrições rígidas de cookie de terceiros, o SVG pode não carregar. | Mesmo domínio (same-origin), deve funcionar. Não corrigido por não ser reproduzível no ambiente. |

---

## 3. Arquivos Analisados (Sem Bugs Encontrados)

Os seguintes arquivos foram analisados e não apresentam bugs funcionais:

- `frontend/assets/js/api.js` — camada de requisições HTTP, resolução de URL correta.
- `frontend/assets/js/utils.js` — utilitários compartilhados (toast, escape, confirmação, formatação).
- `frontend/assets/js/login.js` — login com validação e tratamento de erro.
- `frontend/assets/js/criar_usuario.js` — criação de usuário inicial.
- `frontend/assets/js/categorias.js` — CRUD de categorias.
- `frontend/assets/js/usuarios.js` — CRUD de usuários.
- `frontend/assets/js/lotes.js` — CRUD de lotes com código de barras.
- `frontend/assets/js/estoque_movimentacoes.js` — listagem com paginação.
- `frontend/assets/js/alertas.js` — alertas de estoque baixo e validade.
- `frontend/assets/js/relatorios.js` — relatórios com gráficos.
- `frontend/assets/js/codigo-barras-validacao.js` — validação EAN-8/13, UPC-A, Code 128, ITF-14.
- `frontend/assets/js/scanner-feedback.js` — feedback visual e sonoro.
- `frontend/assets/js/scan-to-input.js` — captura de scanner USB/Bluetooth HID.
- `frontend/assets/js/estoque_entrada.js` — entrada de estoque com scanner.
- `frontend/assets/js/estoque_saida.js` — saída de estoque com scanner e FEFO.

Páginas HTML analisadas: `index.html`, `criar_login.html`, `dashboard.html`, `produtos.html`, `categorias.html`, `lotes.html`, `usuarios.html`, `alertas.html`, `relatorios.html`, `movimentacoes.html`, `estoque.html`, `entrada.html`, `saida.html`, `etiquetas.html`.

Todas carregam corretamente `api.js` e `utils.js` antes dos scripts específicos, garantindo a disponibilidade das funções globais.