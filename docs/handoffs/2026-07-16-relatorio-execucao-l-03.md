# Relatório de execução e diagnóstico — L-03

**Data:** 2026-07-16  
**Task:** `L-03` — MoR + hard-stop legal  
**Executor:** `gpt-5`  
**Branch de código:** `task/L-03`  
**Commit:** `6bdbcbd`  
**Resultado:** implementação e push concluídos; task mantida em `in_progress` porque o lint global do pacote falhou em erros basais fora do escopo.

## 1. Resumo executivo

A implementação funcional da L-03 foi concluída e validada por build e por **241 testes verdes**. O principal diagnóstico é que o crescimento do tempo das tasks não está concentrado na escrita de código: preparação da worktree, reconstrução de dependências, gates redundantes, falhas basais e recuperação de estado consumiram a maior parte do fluxo observável.

O intervalo entre o registro de `start` (19:47) e o último `pause` (20:19) foi de aproximadamente **32 minutos**. Esse intervalo não é tempo líquido de desenvolvimento: inclui interação humana, uma pausa para recuperação do repositório de controle, tentativas que falharam e análise. Os comandos principais cronometrados somaram **155,2 s (2 min 35,2 s)**. A diferença não deve ser tratada como “tempo de codificação” sem telemetria automática por chamada.

Os três maiores ganhos imediatos são:

1. desacoplar a criação de worktree da limpeza do Docs;
2. criar um gate canônico que construa dependências na ordem correta e registre tempos;
3. zerar ou isolar formalmente os erros basais de lint.

## 2. Entrega realizada

- Criado `packages/core/src/workflow/mor-hardstop.ts`.
- Integrado o hard-stop fiscal no pipeline de `workflow-engine.ts`.
- Adicionado `FiscalTransition` ao protocolo e ao barrel export.
- Criados três testes de integração: transição permitida com NF-e, bloqueio sem NF-e e compatibilidade de workflow sem MoR.
- Reutilizadas as implementações existentes de `MoRWorkflowContext`, `evaluateBlockingRules` e `BlockingError`, sem duplicar a lógica das tasks 009-01/009-02.
- Commit `6bdbcbd` enviado para `origin/task/L-03`.

## 3. Tempos medidos

| Parte | Tempo de parede | Resultado | Observação |
|---|---:|---|---|
| Criação da worktree | 58,0 s | sucesso | Inclui fetch/preparo e `pnpm install` |
| `pnpm install` | 33,3 s | sucesso com fallback opcional | Está contido nos 58,0 s; não deve ser somado novamente |
| Pré-build `crypto → protocol` | 5,2 s | sucesso | Necessário porque a worktree nova não tinha `dist/` das dependências (P-012) |
| Build `protocol → core` | 25,7 s | sucesso | Reexecutou parte da cadeia para chegar ao pacote-alvo |
| Suíte completa de `core` | 33,2 s | 27 arquivos / 241 testes verdes | Vitest reportou 24,65 s internamente |
| `sqliteStorage.test.ts` | 15,2 s | sucesso | Tempo interno à suíte; representa cerca de 46% do tempo de parede da suíte e não deve ser somado |
| Lint global de `core` | 15,2 s | falha | 13 erros de `StoragePort` em arquivos fora do escopo da L-03 |
| Lint restrito a `src/workflow` | 8,5 s | sucesso | Evidência auxiliar; não substitui o gate global |
| Push da branch | 9,4 s | sucesso | `origin/task/L-03` |
| **Total dos comandos principais não sobrepostos** | **155,2 s** | — | Exclui os tempos internos de install e `sqliteStorage.test.ts` |

### Limites da medição

- Não houve captura automática de início/fim de todas as chamadas de ferramenta; portanto, o relatório não inventa uma contagem total de chamadas.
- Tentativas iniciais de teste, correções de patch, inspeções, transições do MGTIA e espera por interação não tiveram cronômetro estruturado.
- O relógio de 32 minutos contém uma interrupção causada pelo incidente no Docs; ele serve como lead time da sessão, não como benchmark puro da task.
- Tempos frios e quentes não foram rotulados. Uma comparação futura precisa registrar cache, existência de `node_modules`/`dist`, máquina, Node, arquitetura e commit-base.

## 4. Linha do tempo e incidentes

### 4.1 Preparação bloqueada pelo estado do Docs

O primeiro `wt new` recusou prosseguir porque o repositório de controle tinha alterações legítimas. A criação da worktree de código ficou acoplada à limpeza de um repositório compartilhado que não precisava ser modificado para a implementação.

**Impacto:** interrupção do fluxo e necessidade de decisão sobre arquivos que pertenciam a outras tasks.

### 4.2 Limpeza destrutiva interpretada incorretamente

O pedido para “limpar Docs” foi interpretado como descarte das alterações, quando a intenção era preservá-las em commit. Foram usados restore/clean e a recuperação exata de versões não commitadas não foi possível. Os estados canônicos de EST-47 e EST-48a foram depois reconciliados como `done` e enfileirados.

**Impacto:** maior risco e tempo de recuperação do que toda a execução técnica medida.  
**Correção de processo:** em repositório de controle compartilhado, “limpar” deve significar primeiro identificar proprietário e persistir/enfileirar; qualquer descarte exige confirmação explícita e inventário dos arquivos afetados.

### 4.3 Restrição de escrita na worktree externa

O mecanismo normal de patch não tinha permissão de escrita em `C:\Dev2026\.superapp-worktrees\L-03`. Foi necessário usar uma operação elevada como fallback.

**Impacto:** chamadas extras, falha de patch e caminho de edição menos direto.  
**Correção de ambiente:** incluir o diretório canônico de worktrees nos writable roots da sessão que executa `/executar-task`.

### 4.4 Dependências sem artefatos compilados

O primeiro teste falhou porque `@plataforma/protocol` não possuía `dist`; o build do protocolo, por sua vez, exigiu `crypto`. O comportamento já está documentado no P-012.

**Impacto:** diagnóstico repetitivo e comandos adicionais em toda worktree nova.

### 4.5 Gate global vermelho por dívida basal

Build e testes passaram, mas o lint global encontrou 13 usos depreciados de `StoragePort` em seis arquivos não tocados pela L-03. O lint restrito ao escopo passou, porém a regra do MGTIA corretamente não permite substituir o gate global por um gate parcial.

**Impacto:** implementação pronta, mas task impedida de avançar para review; o custo será repetido nas próximas tasks do mesmo pacote.

### 4.6 Semântica de pausa pouco visível

O serviço registrou `[Pausado/Handoff]`, mas o status exibido permaneceu `in_progress`.

**Impacto:** dificulta distinguir trabalho ativo de trabalho entregue porém bloqueado, prejudicando métricas de WIP e tempo de fila.

## 5. Diagnóstico das causas

| Prioridade | Causa | Evidência da L-03 | Efeito recorrente |
|---|---|---|---|
| P0 | Gate basal vermelho | 13 erros fora do escopo após build/test verdes | Toda task de `core` pode parar no mesmo ponto |
| P0 | Worktree acoplada ao Docs limpo | alterações legítimas impediram `wt new` | Bloqueio cruzado entre agentes/tasks |
| P0 | Gate não prepara o grafo | necessidade manual de `crypto → protocol → core` | Falhas falsas em worktree nova e repetição de builds |
| P1 | Telemetria manual | só alguns comandos têm tempo confiável | Não é possível explicar o restante dos 32 min |
| P1 | Writable root incompleto | patch normal falhou na worktree | Escalação e ferramentas alternativas |
| P1 | Especificação pouco executável | foi necessário inferir assinaturas/exports a partir do código | Mais leitura e maior variância entre agentes |
| P2 | Teste concentrado | `sqliteStorage.test.ts` consumiu 15,2 s | Feedback local mais lento |
| P2 | Instalação por worktree | 33,3 s, 57% da criação da worktree | Custo fixo antes de cada task |

## 6. Sugestões priorizadas

### P0 — aplicar primeiro

#### 1. Desacoplar `wt new` do estado limpo do Docs

O script deve tratar Docs como controle compartilhado e somente leitura durante a criação da worktree. Pode fazer `fetch`, informar divergência e usar o estado atual para ler a task, mas não deve exigir `pull`/working tree limpo nem sugerir `stash`, `restore` ou `clean` no Docs. A exigência de limpeza deve permanecer apenas no repositório de código que será ramificado.

**Critério de aceite:** uma alteração não relacionada em `tasks/*.md` não impede criar uma worktree do SuperApp, e nenhuma ação destrutiva é oferecida automaticamente.

#### 2. Criar um gate canônico por pacote

Adicionar um comando único, por exemplo `pnpm gate @plataforma/core`, que:

- descubra e construa dependências internas em ordem topológica;
- execute build, test e lint do pacote-alvo exatamente uma vez;
- pare no primeiro erro real, identificando a fase;
- grave tempos de parede e saída literal do gate;
- diferencie falha introduzida pela task de baseline já registrado, sem tornar o baseline invisível.

**Critério de aceite:** uma worktree nova executa um único comando e não falha por ausência de `dist` de dependências.

#### 3. Restaurar baseline verde de lint

Corrigir os 13 erros de `StoragePort` em uma task própria e priorizá-la antes de novas tasks de `core`. Se a correção imediata for inviável, adotar temporariamente um baseline versionado que apenas impeça erros novos, com responsável e prazo de remoção — nunca ignorar o lint inteiro.

**Critério de aceite:** `pnpm --filter @plataforma/core lint` retorna zero em `master`, ou o gate demonstra de forma automática e auditável que a task não aumentou uma baseline temporária explícita.

#### 4. Proibir limpeza destrutiva implícita no Docs

Incluir no `worktree.mjs` e na skill `/executar-task` um preflight que classifique arquivos sujos por proprietário/task. `restore`, `clean` e descarte só podem ocorrer após confirmação explícita contendo a lista de paths e a informação de que mudanças não commitadas podem ser irrecuperáveis.

**Critério de aceite:** a palavra “limpar” sozinha nunca autoriza descarte.

### P1 — melhorar observabilidade e previsibilidade

#### 5. Telemetria JSONL automática

Instrumentar `worktree.mjs`, `manage-task.mjs` e o gate para escrever um evento por fase:

```json
{"task":"L-03","phase":"test","command":"pnpm --filter @plataforma/core test","startedAt":"...","endedAt":"...","wallMs":33200,"exitCode":0,"cache":"unknown","machine":"windows-arm64"}
```

Campos mínimos: task, commit-base, máquina/arquitetura, versão do Node/pnpm, fase, comando normalizado, início, fim, duração, exit code, cache frio/quente e motivo de retry. Segredos e argumentos sensíveis devem ser removidos.

**Critério de aceite:** 100% das fases de setup, implementação assistida, gate, transição e push têm duração; fases aninhadas são marcadas para evitar dupla contagem.

#### 6. Tornar worktrees graváveis para o executor

Configurar `C:\Dev2026\.superapp-worktrees` como writable root das sessões de worker.

**Critério de aceite:** a ferramenta padrão de patch edita a worktree sem escalação e sem fallback por shell.

#### 7. Endurecer specs com contratos executáveis

Fixar na task as assinaturas TypeScript, tipos de retorno, paths de testes, exports e comportamento de erro esperados. Isso reduz busca e decisões locais sem aumentar o escopo.

**Critério de aceite:** o worker consegue escrever primeiro o teste a partir da spec, sem inferir a API pública lendo múltiplos arquivos.

#### 8. Representar pausa/bloqueio no estado projetado

Expor um subestado ou campo projetado como `in_progress:paused`, mantendo compatibilidade com o ciclo existente.

**Critério de aceite:** dashboard e ledger distinguem task ativa, pausada e bloqueada, e o relógio de trabalho ativo não continua correndo durante handoff.

### P2 — otimizar após medir

#### 9. Reduzir o custo de instalação

Antes de mudar a estratégia, medir separadamente worktree fria/quente. Avaliar reaproveitamento seguro do store e instalação offline quando o lockfile não mudou, sem compartilhar arquivos mutáveis entre worktrees.

**Meta inicial:** reduzir a preparação quente de 58 s para menos de 30 s, sem introduzir os problemas de hardlink/symlink descritos nos pitfalls.

#### 10. Investigar `sqliteStorage.test.ts`

Perfilar setup/teardown, criação de banco e serialização dos casos. Manter a suíte completa no gate; otimizar fixtures ou selecionar teste específico apenas no ciclo TDD local.

**Meta inicial:** reduzir o arquivo de 15,2 s sem alterar cobertura nem tornar o teste dependente de estado externo.

## 7. Plano recomendado de implementação

1. Criar e executar a task de baseline do lint de `core`.
2. Alterar `worktree.mjs` para não bloquear por Docs sujo e adicionar o guard contra descarte.
3. Implementar o comando de gate com build topológico e JSONL.
4. Adicionar writable root das worktrees ao perfil do worker.
5. Rodar três tasks reais com a telemetria nova e comparar mediana/p95 por fase.
6. Só então otimizar instalação e a suíte SQLite com base nos dados.

## 8. Indicadores para acompanhar

- lead time total por task e tempo ativo descontando pausas;
- tempo de setup, implementação, gate, revisão e retrabalho;
- quantidade e duração de retries por causa;
- percentual de tasks bloqueadas por baseline;
- cache frio versus quente;
- mediana e p95 por pacote, máquina e complexidade;
- taxa de gates verdes na primeira execução;
- incidentes envolvendo estado sujo ou perda de mudanças.

Uma única execução não estabelece tendência. A L-03 fornece um caso diagnóstico e um formato inicial; a conclusão sobre regressão deve usar ao menos três execuções comparáveis por pacote/ambiente, preferencialmente cinco ou mais.
