# ETAPA 11 — CONTROLE AUTOMÁTICO DE PROGRESSO E RETOMADA

Esta etapa é obrigatória e deverá ser seguida durante toda a execução das etapas 1 a 10.

O objetivo é garantir que, caso o OpenCode apresente algum erro, a sessão seja encerrada, o modelo reinicie ou o trabalho seja interrompido, seja possível continuar exatamente de onde parou, sem refazer tarefas concluídas.

## 1. Arquivo de progresso

Criar e manter atualizado:

`docs/PROGRESSO_MANUTENCAO.md`

Esse arquivo deverá registrar todas as etapas e subtarefas do plano principal.

Utilizar os seguintes status:

- `[ ]` Pendente.
- `[~]` Em andamento.
- `[x]` Concluída e testada.
- `[!]` Erro ou bloqueio.
- `[?]` Aguardando autorização ou validação manual.

## 2. Leitura inicial obrigatória

Antes de começar qualquer trabalho:

1. Ler integralmente este documento de implementação.
2. Verificar se `docs/PROGRESSO_MANUTENCAO.md` já existe.
3. Se existir, ler seu conteúdo integralmente.
4. Verificar o estado atual do Git.
5. Conferir quais arquivos já foram modificados.
6. Identificar as etapas concluídas e pendentes.
7. Retomar da primeira tarefa ainda não concluída.

Se o arquivo de progresso não existir, criá-lo com todas as etapas e subtarefas deste plano.

Não iniciar novamente uma etapa que já foi concluída e validada.

## 3. Atualização após cada alteração

Sempre que realizar uma alteração:

1. Salvar os arquivos.
2. Registrar quais arquivos foram modificados.
3. Verificar se a alteração foi aplicada corretamente.
4. Executar os testes correspondentes.
5. Atualizar imediatamente o arquivo de progresso.
6. Marcar a tarefa como `[x]` somente após a validação.

Não esperar terminar uma etapa inteira para registrar pequenas alterações já realizadas.

## 4. Registro detalhado

Para cada tarefa, registrar:

- Nome da etapa.
- Descrição da alteração.
- Arquivos criados.
- Arquivos modificados.
- Testes executados.
- Resultado dos testes.
- Problemas encontrados.
- Próxima tarefa.

Exemplo:

```markdown
# PROGRESSO DA MANUTENÇÃO AGROSTOCK

## Etapa 1 — Backup
- [x] Verificar estado do Git.
- [x] Conferir alterações locais.
- [x] Criar backup seguro.

Status: CONCLUÍDA

## Etapa 2 — Auditoria
- [x] Analisar frontend.
- [x] Analisar backend.
- [x] Verificar dependências.
- [~] Finalizar relatório.

Status: EM ANDAMENTO

## Etapa 3 — Leitor de código de barras
- [ ] Corrigir ENTER automático.
- [ ] Testar cadastro de produtos.
- [ ] Testar cadastro de lotes.

Status: PENDENTE

## Próxima ação
Finalizar o relatório da auditoria estrutural.
```

## 5. Recuperação após erros

Se ocorrer:
- Erro do modelo.
- Interrupção da sessão.
- Falha de execução.
- Fechamento do OpenCode.
- Perda de contexto.
- Erro durante alguma implementação.

O OpenCode deverá:

1. Não reiniciar o projeto.
2. Ler o arquivo de progresso.
3. Verificar o estado atual dos arquivos.
4. Conferir o Git.
5. Identificar a última alteração realizada.
6. Verificar se ela foi concluída ou ficou incompleta.
7. Executar somente o que estiver faltando.
8. Atualizar o arquivo de progresso.

Não repetir alterações já realizadas e testadas.

Se uma tarefa estiver parcialmente concluída, continuar a partir do último ponto validado.

## 6. Histórico permanente

Manter um histórico cronológico dentro do arquivo de progresso.

Exemplo:

```markdown
## Histórico de execução

### 16/11/2026
- Backup realizado.
- Auditoria do frontend iniciada.
- Identificadas dependências entre arquivos.
- Nenhum arquivo removido.

### 17/11/2026
- Auditoria concluída.
- Correção do ENTER iniciada.
- Testes do cadastro de produtos realizados.
```

Nunca apagar registros anteriores.

## 7. Resumo ao interromper o trabalho

Antes de encerrar uma sessão, atualizar o arquivo e apresentar:

- Última etapa concluída.
- Etapa atual.
- Alterações realizadas.
- Arquivos modificados.
- Testes executados.
- Erros encontrados.
- Próxima tarefa exata.

## 8. Regras de continuidade

1. O arquivo de progresso deverá ser atualizado durante todo o desenvolvimento.
2. Nunca marcar tarefas não testadas como concluídas.
3. Nunca apagar o histórico.
4. Nunca refazer etapas concluídas sem necessidade comprovada.
5. Nunca sobrescrever alterações anteriores sem verificá-las.
6. Nunca iniciar uma nova etapa enquanto houver bloqueios que impeçam sua execução segura.
7. Atualizar o progresso mesmo quando uma tarefa falhar.
8. Registrar qualquer autorização pendente.
9. Preservar os arquivos e dados existentes.
10. Retomar sempre da última tarefa validada.

## REGRA FINAL

O arquivo `docs/PROGRESSO_MANUTENCAO.md` deverá funcionar como memória permanente da execução deste plano.

Sempre que o OpenCode for iniciado novamente, deverá ler primeiro este documento e o arquivo de progresso, verificar o estado real do projeto e continuar exatamente de onde parou.

**Não recomeçar tudo. Não repetir tarefas concluídas. Não perder o histórico. Não declarar conclusão sem testes.**