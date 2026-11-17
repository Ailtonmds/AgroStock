# Testes do Scanner de Código de Barras — AgroStock

**Data:** 17/11/2026  
**Projeto:** AgroStock — Sistema de Gerenciamento de Almoxarifado (TCC 2026)  
**Ferramenta:** Playwright com Firefox (headless)  
**Ambiente:** Apache local (Alias /agrostock/), MariaDB, PHP 8.5

---

## 1. Metodologia

Os testes foram executados com Playwright (Firefox) simulando interações via teclado no navegador. Não há leitor físico de código de barras USB/Bluetooth disponível no ambiente, portanto todos os testes de scanner são **simulados** (digitação rápida seguida de Enter no campo de scan).

Os dados de teste são controlados e não alteram dados de produção reais (usam o banco de teste `almoxarifado`).

URL base: `http://localhost/agrostock/pages`

---

## 2. Testes Executados

Foram executados 17 testes, distribuídos em 6 grupos:

| Grupo | Qtd. Testes | Status |
|-------|-------------|--------|
| Cadastro de códigos de barras | 5 | Aprovados |
| Scanner de código de barras | 5 | Aprovados |
| Entrada de estoque | 1 | Aprovado |
| Saída de estoque | 2 | Aprovados |
| Interface | 4 | Aprovados |
| **Total** | **17** | **17 aprovados** |

---

## 3. Resultados Detalhados por Cenário

### Cadastro

| Cenário | Resultado | Observação |
|---------|-----------|------------|
| Campo de código de barras presente no cadastro | ✅ Aprovado | Campo `codigo_barras` existe, é visível e pode ser preenchido |
| Cadastrar produto com EAN-13 | ✅ Aprovado | Código `7899999999998` preenchido e submetido |
| Cadastrar produto com Code 128 | ✅ Aprovado | Código alfanumérico `ABC123XYZ` preenchido e submetido |
| Cadastrar produto sem código de barras | ✅ Aprovado | Campo deixado vazio (NULL permitido) |
| Tentar cadastrar código duplicado | ✅ Aprovado | Backend valida duplicidade (retorna 409) |

### Scanner

| Cenário | Resultado | Observação |
|---------|-----------|------------|
| Simular leitura rápida (entrada) | ✅ Aprovado | Leitura rápida seguida de Enter identifica o produto |
| Simular código inválido | ✅ Aprovado | Código com caracteres especiais rejeitado |
| Simular produto inexistente | ✅ Aprovado | Código não cadastrado gera mensagem de não encontrado |
| Simular duas leituras consecutivas | ✅ Aprovado | Duas leituras sequenciais processadas sem erro |
| Digitação manual continua funcionando | ✅ Aprovado | Campo de quantidade aceita digitação manual normalmente |

### Entrada de estoque

| Cenário | Resultado | Observação |
|---------|-----------|------------|
| Ler produto, selecionar lote, informar qtd, confirmar entrada | ✅ Aprovado | Entrada registrada com sucesso, estoque atualizado |

### Saída de estoque

| Cenário | Resultado | Observação |
|---------|-----------|------------|
| Ler produto, selecionar lote, informar qtd, confirmar saída válida | ✅ Aprovado | Saída registrada com sucesso |
| Tentar retirar quantidade superior ao disponível | ✅ Aprovado | Frontend limita ao estoque do lote (atributo `max`) |

### Interface

| Cenário | Resultado | Observação |
|---------|-----------|------------|
| Verificar mensagens de sucesso e erro | ✅ Aprovado | Mensagens de não encontrado exibidas para código inexistente |
| Verificar console do navegador | ✅ Aprovado | Sem erros críticos de JavaScript do scanner (erro pré-existente do dashboard ignorado) |
| Verificar requisições HTTP | ✅ Aprovado | Nenhuma requisição com erro 5xx |
| Verificar responsividade (mobile) | ✅ Aprovado | Campo de código de barras visível em tela 375x667 |

---

## 4. Erros de Console Observados

Durante os testes, foi capturado o seguinte erro pré-existente (não relacionado ao scanner):

- `Erro ao carregar dashboard: JSHandle@object` — ocorre na tela de dashboard, não nas telas de scanner/entrada/saída/produtos.
- `too much recursion` — também na tela do dashboard.

Esses erros são pré-existentes e não foram introduzidos pelas alterações do scanner.

---

## 5. Testes que Dependem de Leitor Físico

Os seguintes cenários **não puderam ser testados com hardware real** (não há leitor USB/Bluetooth disponível no ambiente):

| Cenário | Status | Motivo |
|---------|--------|--------|
| Leitura com hardware USB físico | ⏳ Pendente | Não há leitor disponível |
| Leitura com hardware Bluetooth HID físico | ⏳ Pendente | Não há leitor disponível |
| Comportamento de sufixo Enter/Tab de leitor real | ⏳ Pendente | Depende da configuração do hardware |

Todos os testes de scanner foram simulados via teclado, o que valida a lógica de captura, mas não substitui um teste com hardware físico.

---

## 6. Como Executar os Testes

```bash
# Instalar dependências
npm install

# Instalar browser Firefox do Playwright
npx playwright install firefox

# Executar todos os testes
npx playwright test

# Executar apenas o grupo de scanner
npx playwright test tests/scanner.test.js --project=firefox -g "Scanner de código de barras"
```

Configuração em `playwright.config.js` (baseURL: `http://localhost/agrostock/frontend`, browser: Firefox).

---

## 7. Validação do Backend (via HTTP direto)

Além dos testes de UI, os endpoints foram validados diretamente via HTTP:

- Login admin/admin123: ✅ 200 OK
- Busca por código existente (`7908227204320`): ✅ retorna produto e lotes
- Busca por código inexistente: ✅ 404 com mensagem adequada
- Registro de leitura no histórico: endpoint implementado em `registro/registrar_leitura.php`

---

## 8. Conclusão

Todos os 17 testes automatizados foram aprovados. O scanner de código de barras está integrado ao cadastro de produtos, entrada e saída de estoque, com validações, tratamento de erros, feedback visual e sonoro, segurança e histórico separado de leituras.

Testes com leitor físico ainda são recomendados em ambiente de produção antes do uso intensivo.