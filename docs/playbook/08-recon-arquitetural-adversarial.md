# 08 — Recon Arquitetural Adversarial

> **Origem:** rodadas F1/F2 do cluster T-403→T-602→T-603 (2026-07-12, claude-fable). Manual
> operacional para que qualquer modelo (Opus/Sonnet e menores) reproduza o julgamento de um
> recon de arquiteto: provar o que uma spec realmente exige, atacá-la antes de executá-la e
> devolver contratos executáveis. Não é narrativa da sessão — cada regra tem sintoma, check,
> decisão, falha evitada e limite.

---

## 0. Quando aplicar (e quando não)

> **Pré-requisito de altitude:** este manual audita SPEC×CÓDIGO de um cluster. Se o recon é de
> FECHAMENTO DE MARCO (backlog inteiro × código × ledger), rode antes o playbook
> [09-recon-de-fechamento](./09-recon-de-fechamento.md) — integridade física dos arquivos de task
> (BOM/§9), grafo de deps, pais decompostos, capability-fantasma — senão você recon-a specs que o
> dashboard nem enxerga.

**Aplique o manual inteiro** quando a task: (a) declara *integração* com sistema/lib externa;
(b) atravessa fronteira de camadas ou pacotes; (c) promete propriedade transacional,
criptográfica ou de concorrência ("atômico", "assinado", "determinístico", "converge");
(d) é base de ≥2 tasks dependentes.

**NÃO aplique o manual inteiro** para task mecânica (`capacity_target: haiku` — wrapper,
re-export, encode trivial): custa mais que o erro que evitaria. Use só §1 (ordem de leitura)
e §9 (condições de parada). O detector de spec falsa (§3) também não se aplica quando a lib
é detalhe interno de implementação — só quando a integração É o entregável declarado.

**Preserve a ordem normativa.** Se a fonte canônica declara prioridades "na ordem exata de
implementação", trate essa ordem como invariante. Reparos que apenas restauram a base ficam numa
**Fase 0** separada; não justificam antecipar uma capacidade posterior. Use planejamento em onda
móvel: detalhe Fase 0 + a próxima prioridade, feche seu gate real e só então reconstrua a onda
seguinte contra o novo código.

---

## 1. Ordem de leitura do recon

**Sintoma de recon mal começado:** abrir o código antes de saber o que a spec promete, ou
confiar no resumo da task sem ler a fonte normativa.

**Ordem exata (cada passo produz uma lista de claims a confrontar no seguinte):**

1. **As specs do cluster** (task alvo + dependências diretas + dependentes) — extraia cada
   *promessa*: contrato, aceite, teste, dependência declarada.
2. **Fontes canônicas** (verbete em `docs/conceitos/`, caderno citado, ADR, `plano-de-implementacao.md`)
   — para cada promessa, ache a cláusula normativa OU registre "sem fonte". *Exemplo real:*
   o verbete `automerge-repo` apontava `caderno-2-protocol/04` §2–§4 como contrato — foi lá
   que apareceram a fórmula do RendezvousId, o passo 5 da AUTHORED (hashes das changes) e o
   desempate por menor `entity_id` que a T-603 contradizia.
3. **Código real** — não o que a spec DIZ que existe; o que existe: `package.json` de cada
   pacote citado (deps!), o arquivo/linha de cada símbolo citado, o schema. *Exemplo real:*
   `@plataforma/workers` existia com **zero** dependencies e um `index.ts` — fato que tornou
   "mover para workers" barato e seguro.
4. **Histórico das dependências** — pareceres §8 e Log §9 das tasks `done` vizinhas revelam
   desvios já cometidos. *Exemplo real:* T-702 registrou em §6/§8 que contornou a casca
   inexistente com envelope próprio — prova viva de que a spec de T-403 não exigia Automerge.
   **Não confie no claim do log:** todo claim de rework/finish precisa do fato git/fs
   correspondente (arquivo criado existe? import removido sumiu do grep?) — classe **B0, rework
   fictício** (T-1033 rework-1 mentiu item a item; detector completo no playbook 07 R3).
5. **APIs externas** — só depois de saber exatamente o que precisa delas (ver §4).

**Falha que evita:** empilhar specs sobre símbolos que não existem (T-602 citava
`packages/transport/src/automerge/` — diretório inexistente).
**Limite:** em repo greenfield sem cânone, o passo 2 vira "não há fonte" em tudo — siga para
§9 (decisões de arquiteto explícitas), não trave.

---

## 2. Três registros, nunca misturados

Todo achado vai para exatamente um registro:

| Registro | Critério | Forma obrigatória |
|---|---|---|
| **Fato** | reproduzível por comando/leitura | claim + `path:linha` (ou URL + data) |
| **Inferência** | deduzido de fatos, pode estar errado | claim + "derivado de" + fatos-base |
| **Decisão** | escolha entre alternativas viáveis | opções + rejeitadas com motivo + quem decide |

**Check exato:** antes de escrever qualquer frase no relatório/spec, pergunte "se um revisor
pedir a prova, eu colo um path ou um argumento?". Path ⇒ fato. Argumento ⇒ inferência.
Nenhum dos dois ⇒ é decisão (sua ou humana — ver §9).

**Falha que evita:** "decisão" travestida de fato — a D3 de T-603 (`blake2s256(entity_id‖HLC)`)
circulou como se fosse derivada, mas era invenção; o cânone dizia outra coisa.
**Limite:** não exija path para o trivial (sintaxe da linguagem, aritmética). O custo do
registro deve ser menor que o custo do erro.

---

## 3. Detector de spec falsa (fake-integrável)

**Sintoma:** spec "completa" — objetivo, contrato TS, 8 casos de teste, gate — que um worker
consegue satisfazer com uma simulação.

**Check exato (o teste do impostor):** *implemente mentalmente a spec com a estrutura de dados
mais burra possível (`Map` + callbacks) e rode os casos de teste contra ela.* Se tudo passa,
a spec não exige o que o título promete. Sinais confirmatórios, todos reais da T-403 F0:

- nenhum símbolo da lib citado no contrato (nem `Repo`, nem `DocHandle`);
- nenhuma dependência fixada (grep `automerge` em `**/package.json`: vazio);
- nenhum método de acesso ao recurso central (um "doc" que não pode ser lido nem escrito);
- nenhum caso de teste que reprove a simulação.

**Decisão:** endurecer até o teste do impostor reprovar: pinar pacote+versão verificados
(§4), citar os símbolos reais no contrato, e incluir ≥1 **caso anti-fake** — teste que só
passa se a lib real estiver no caminho (ex.: T-403 caso 10 — spy no adapter exige eventos
`'peer-candidate'`/`'message'` do automerge-repo).

**Falha que evita:** 5 tasks downstream empilhadas num rename de pub/sub; retrabalho de
cluster inteiro.
**Limite:** lib como detalhe interno (cache, logger) não precisa de anti-fake — teste
comportamento, não implementação. Anti-fake é para quando a integração é o entregável.

---

## 4. Verificação de API externa — protocolo anti-invenção

**Regra absoluta: PARE se precisar inventar uma API de terceiro.** Inventar a própria API
(contrato do seu módulo) é design; inventar a de terceiro é bug futuro certo.

**Procedimento (todos executados em F1/F2):**

1. **Versão/pacote:** registry oficial (`https://registry.npmjs.org/<pkg>/latest`) — nunca
   memória de treino. Anote versão E data da consulta na spec.
2. **Assinaturas:** fonte do repositório oficial (raw no branch principal). Se a doc gerada
   404ar (aconteceu 3×), caia para o arquivo-fonte; se o raw 404ar, use o conector MCP do
   GitHub (`get_file_contents` ou equivalente) e decodifique a resposta quando necessário.
3. **Cite na spec o que verificou:** símbolo + arquivo da lib + o que ele garante
   (ex.: "`DocHandle.broadcast(message: unknown)` — verificado em DocHandle.ts").
4. **O que não conseguiu verificar não entra no contrato.** Reformule para não depender, ou
   registre como risco explícito com plano de verificação no primeiro passo do worker.

**Falha que evita:** contrato citando `putEdge` que não existia — em F1 quase aconteceu o
inverso: a D3 de T-602 dizia "signEdge+putEdge" e o grep provou que `putEdge` existia
(`ports.ts:194`); sem o grep, teria sido chute nos dois sentidos.
**Limite:** APIs de altíssima estabilidade (stdlib do Node, `JSON.parse`) dispensam o ritual.

---

## 5. Prove a proposta contra o código real (não contra a abstração)

**Sintoma:** a spec promete uma propriedade ("tudo na mesma transação") que a *interface*
parece suportar, mas a *implementação* não.

**Check exato:** para cada propriedade prometida, leia a implementação concreta que a
sustentaria, não o tipo. *Exemplo real (F2):* `StoragePort.transaction` parecia componível;
a implementação faz `BEGIN`/`COMMIT` crus **sem savepoint** (`sqliteStorage.ts:110-121`) e
`insertNode` abre a própria transação (`lineage.ts:105`) — logo "envolver tudo numa transação
externa" quebraria em runtime. O contrato F1 era inimplementável e só a leitura da
implementação revelou.

Checklist mínimo por propriedade:
- **Transacional:** quem abre BEGIN? aninha? o helper que vou chamar abre a dele?
- **Retornos:** o helper devolve o que meu contrato promete devolver? (`insertNode` retorna
  `void`; `CommitResult` queria o id da MUTATES ⇒ a spec teve que fixar o SELECT pós-insert.)
- **Callbacks/eventos:** a assinatura real bate? (`onMessage` retornava unsubscribe; a spec
  antiga dizia `void`.)

**Falha que evita:** worker descobrir em runtime que o design não fecha — e "resolver
sozinho" com workaround (classe de bug EST-04a).
**Limite:** não leia TODA implementação — só as que sustentam propriedades prometidas.

---

## 6. Acoplamento de camadas, contratos impossíveis, dependências ocultas

**Checks exatos (cada um pegou um problema real):**

1. **Seta de camadas:** para cada import do contrato, confira a direção contra a ordem
   canônica (`visao-arquitetural.md §1`). Import que inverte ⇒ ou o módulo está no pacote
   errado, ou o tipo está na camada errada. *Real:* `commitCycle` em core importando
   `AutomergeDocId` de transport (F0) e `deterministicCommitter` em core importando
   `CommitCycle` de workers (F1, T-603) — mesma inversão, dois níveis.
2. **Transitividade:** decisão que move um módulo de pacote arrasta os que o importam.
   *Real:* D1 de T-602 (→workers) obrigou T-603 a mudar de pacote junto.
3. **Dependência oculta em recurso, não em código:** o pacote destino tem as deps de
   workspace necessárias? (`workers` tinha zero — a spec teve que declarar `[UPDATE]
   package.json`.) O schema aceita o valor novo? (`edge_type TEXT` sem CHECK ⇒ `AUTHORED`
   entra sem migração — fato que dissolveu metade da D3.)
4. **Deps de frontmatter vs deps reais:** a spec usa `insertNode` (T-108)? Então T-108 é
   dependência declarável, mesmo que já `done`.

**Falha que evita:** ciclo core↔transport (classe do bug T-1033).
**Limite:** não transforme toda utilidade compartilhada em "violação" — a pergunta é sempre
"a seta canônica permite?", não "os pacotes se conhecem?".

---

## 7. Red-team mínimo (seis vetores, sempre os mesmos)

Rode cada vetor contra o design ANTES de fechar a spec. Cada linha vem de um furo real:

| Vetor | Pergunta-gatilho | Furo real encontrado | Correção especificada |
|---|---|---|---|
| **Concorrência** | o que chega *durante* a operação? | change de peer durante commit era apagada pelo `clearStaging` full-wipe | limpeza seletiva por `changeIds` do lote |
| **Falha parcial** | e se o passo N de M falhar? | falha no `putEdge` da AUTHORED deixava nó órfão persistido | transação única na primitiva + teste de rollback total |
| **Reconexão** | o canal repõe o que perdi? | ephemeral é fire-and-forget; peer que caiu perdia changes | staging local sobrevive + `A.merge` com snapshot via RBSR |
| **Expiração/lifecycle** | o TTL pode disparar no meio do uso? | TTL absoluto podia evictar doc durante commit | TTL de ociosidade + refcount: evicção impossível com handle aberto |
| **Divergência assinado≠persistido** | o que é assinado é o que é gravado? | changes durante a coleta mudavam o snapshot | `PreparedCommit` congela bytes; finalize persiste exatamente eles |
| **Framing/segurança** | quem valida origem, tamanho, canal? | "CBOR → port.send" sem demux, sem Noise, sem teto | lanes pós-Noise, frame v1 `EPHEMERAL`+`ch`, teto 1 MiB, spoof-check |

**Decisão:** cada furo confirmado vira (a) cláusula no contrato E (b) caso de teste
adversarial numerado. Furo sem teste é furo que volta.
**Gate real:** mocks e stubs são válidos para testes determinísticos, mas não demonstram que a
capacidade de produto funciona. O aceite da onda exige pelo menos uma execução pelo caminho real
relevante (provider real, browser real, persistência real etc.), sem segredo gravado no artefato.
**Falha que evita:** aceite verde com propriedade furada (a métrica não medía o que a spec
exigia — classe do B1 de T-402).
**Limite:** seis vetores são o piso para specs de protocolo/estado distribuído. Para UI ou
tooling local, escolha os que têm superfície (geralmente falha parcial e lifecycle).

---

## 8. Primitiva nova vs alargar porta

**Sintoma:** a operação composta precisa de algo que nenhuma interface atual oferece.

**Check exato (nesta ordem):**
1. Quantos consumidores têm a necessidade? Um ⇒ NÃO alargue contrato genérico.
2. Quem é o dono do invariante que a operação protege? A primitiva nasce lá.
3. A primitiva nova consegue *absorver* a antiga por delegação (zero mudança de
   comportamento, suíte existente prova)?

*Exemplo real:* atomicidade de nó+arestas ⇒ `insertNodeWithEdges` no core (dono dos
invariantes de linhagem), `insertNode` delega com `extraEdges=[]`, `GraphStorePort` intocado.
Alternativa rejeitada: savepoints na porta — mexeria em 2 impls + contrato para servir um
único consumidor.

**Falha que evita:** porta genérica inchada por caso especial (e o teste combinatório que vem
junto).
**Limite:** no 2º ou 3º consumidor da mesma necessidade, reavalie — aí sim pode ser da porta.

---

## 9. Condições de parada e decisão humana

**PARE e escale para humano SOMENTE quando nenhuma fonte resolve E a escolha é de
produto/governança/risco.** Antes de escalar, três checks na ordem:

1. **Re-busque o cânone** — um flag "sem fonte" herdado pode estar errado. *Real:* a D3 de
   T-603 foi ratificada "sem fonte" quando `caderno-2 §4` resolvia (e contradizia) — uma
   busca dirigida teria evitado a decisão fantasma.
2. **É decisão técnica com default óbvio?** Arquiteto decide, registra opções rejeitadas e
   segue (ownership do doc vivo, primitiva vs porta — decididas sem humano).
3. **Sobrou escolha genuína de política?** Então formule como a pergunta da co-assinatura
   parcial: alternativas concretas (congelar / quórum K-de-N / escape por governança) +
   default proposto + onde a resposta será gravada.

**Outras paradas obrigatórias:** API de terceiro que teria de ser inventada (§4); evidência
de que um artefato de OUTRA task precisa mudar antes (registre a dependência e pare — não
edite artefato alheio); serviço MGTIA rejeitando transição (a rejeição é informação, nunca
contorne editando status na mão — em F2, `harden`/`block_decision` rejeitados provaram que os
status já estavam corretos).

**Lifecycle não é efeito colateral da execução.** `agent:done`, retorno de tool ou workflow
encerrado não equivalem a `finish`/`review`. Transições passam pelo serviço MGTIA e continuam
sujeitas ao Gate de Evidência (build, test e lint quando exigidos). O orquestrador não pode
"ajudar" contornando esse contrato.

**Falha que evita:** os dois extremos — inventar para não perguntar, e perguntar o que a
fonte já responde.
**Limite:** máximo de 2–4 perguntas humanas por recon, com opções fechadas. Lista longa de
perguntas abertas é recon inacabado.

---

## 10. Saída executável por Sonnet (o que o recon entrega)

Uma spec pós-recon deve permitir que um modelo menor execute CEGO. Padrões usados em F2:

- **Contratos TS com procedência inline:** cada import/símbolo com `// arquivo:linha` ou
  `// verificado em <fonte da lib>`. Comentário de contrato explica O INVARIANTE, não o óbvio.
- **Sequência obrigatória numerada** dentro do doc-comment quando a ordem é o invariante
  (fluxo prepare→co-sign→finalize com "nunca nó primeiro, assinaturas depois" e o porquê).
- **Testes numerados em dois blocos:** funcionais (1–N) e adversariais (N+1–M), cada
  adversarial amarrado ao vetor do §7 que o gerou.
- **DoD com comandos literais** (`pnpm --filter <pkg> build|test|lint`) + checklist que cobra
  as propriedades red-teamadas ("finalize NÃO abre transação própria?"), não genéricas.
- **Regras NÃO-FAZER específicas** (proibir o atalho exato que a simulação tomaria), nunca
  "tenha cuidado com X".
- **§6 com decisões datadas:** DECIDIDO/REVOGADO/PERGUNTA-HUMANA, com quem, quando e fonte —
  o próximo agente lê §6 e sabe o que ainda está vivo.

Para desenvolvimento incremental, a saída é assimétrica: a **onda atual** recebe paths,
assinaturas, sequência, testes e comandos exatos; ondas futuras recebem apenas capacidade,
dependências já provadas e gate observável. Endurecer antecipadamente todo o roadmap congela
suposições que a onda atual ainda vai invalidar.

**Falha que evita:** spec que exige julgamento de arquiteto no meio da execução (Sonnet trava
ou improvisa).
**Limite:** procedência inline tem custo de manutenção — use para invariantes e integrações,
não para cada linha trivial.

---

## 11. Limites conhecidos deste manual (red-team do próprio manual)

- **Onde ele evita erro real:** aplicado à F0 de T-403, o §3 reprova a spec em minutos (os 8
  casos passavam num `Map`) e o §4 teria bloqueado a D3 fantasma de T-603 — dois defeitos que
  custaram uma rodada inteira de revisão.
- **Onde ele falharia ou seria excessivo:** (a) em task mecânica de 1 arquivo, o custo do
  ritual supera o do erro — por isso o §0 restringe o escopo; (b) em greenfield sem cânone,
  os §§1–2 degeneram em "sem fonte" universal e o §9 poderia sugerir escalar tudo ao humano —
  errado: sem fonte *possível*, o arquiteto decide e registra (o humano entra por política,
  não por falta de biblioteca); (c) o §7 assume estado distribuído — para uma CLI local,
  metade dos vetores não tem superfície e insistir neles é teatro de segurança.
- **Ajuste incorporado:** §0 (gate de escopo), §9 passo 2 (default técnico é do arquiteto) e
  a nota de limite do §7 existem exatamente por causa desses contraexemplos.
