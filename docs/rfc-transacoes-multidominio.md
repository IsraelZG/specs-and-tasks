# RFC-002 — Transações Multidomínio: Sagas TTL, 2PC e Liquidação Social

> **Status:** Proposta consolidada para implementação.
> **Versão:** 1.0.
> **Precedência:** Estende a `rfc-v4.md` (§2.3 serialização por linhagem, §2.4 fluxo intent-hub, §5.3 território de pesquisa). Não revoga nada; resolve o item de §5.3 "transferência atômica entre tipos/emissores distintos".

---

## §1 — A Afirmação Honesta: Limites Estruturais

A atomicidade cross-domínio **não é** um invariante de core como a serialização por linhagem (RFC v4 §2.3). O core não enforça tudo-ou-nada entre domínios sem um coordenador confiável; um coordenador transdomínio genuinamente trustless *para safety financeira* seria um "super peer por outro nome" — e super peers não existem aqui.

**O que o core garante permanece sendo:**
- **Safety por perna** (cada leg respeita a invariante de serialização da sua linhagem, independentemente).
- **Causalidade local** (ordem de operações dentro de um domínio é determinística via HLC).

**O que o core NÃO garante:**
- Consistência cross-domínio instantânea (há sempre uma janela intermediária observável).
- Atomicidade forçada sem isolamento (exceto sob tiers específicos de isolamento).

**Conclusão:** Consistência cross-domínio é um **padrão de composição (protocolo), não uma primitiva**. Modelamos com reservas temporizadas (`ASSET:LOCK` com TTL) e oferecemos tiers escalonados de isolamento (Saga, 2PC) — não garantia tudo-ou-nada grátis.

---

## §2 — Tier 1 (Default): Saga com `ASSET:LOCK` e TTL

A operação multidomínio de decompõe em ops single-domain já serializáveis (RFC v4 §2.4), coladas por **reservas com prazo de expiração**. Zero tipos de nó novos — `ASSET:LOCK` (já existe, ontologia §3.3 / caderno-3/01 §3) faz toda a cola.

### 2.1 Anatomia da Saga

**Reservar uma perna:**
- Uma op não-comutativa normal cuja **output em vez de transferência final é um `ASSET:LOCK`** temporário.
- O lock ancora no head específico do recurso pela aresta `SPENDS` existente (RFC v4 §2.2).
- **Herda automaticamente a detecção estrutural de conflito:** duas reservas no mesmo head colidem (ambas criam intents com `SPENDS` → head idêntico).
- Payload do lock inclui TTL e identificador do orquestrador da saga.

**Confirmar uma perna:**
- Op que consome o lock e materializa o efeito real (transferência final).
- Reusa a aresta `CREDITS` existente para o destino (RFC v4 §2.2).
- Adjudicada como qualquer op não-comutativa (validador da linhagem do lock aprova).

**Expiração/Falha:**
- O TTL do lock é um **predicado adjudicado pelo validador-dono da linhagem** contra o relógio dele (HLC).
- Expiração = lápide/sinal de morte (caderno-3/01 §2.2), liberando o head automaticamente.
- **TTL é a compensação automática** — sem coordenador vivo dirigindo o abort.

**Reversão:**
- Lançamento compensatório append-only (nunca deleção).
- Compensações devem ser **idempotentes + com retry automático** (agente orquestrador re-tenta até limite).

### 2.2 Limite Honesto do Tier 1

- **Sem isolamento de snapshot:** existe janela onde a perna A commitou e a B não. Ex: motorista reservado mas passageiro não-confirmado em corrida; authorization no BaaS mas estoque não-debitado.
- **Padrão de mercado aceitável**, mas declarado explicitamente na SPEC (tag `consistency: eventual` / `isolation: none`).
- UI deve sinalizar ambígua operações em andamento como "não-garantidas / baseadas em confiança".

### 2.3 Exemplos Reais

**Ride-matching P2P:**
1. Passageiro cria intent de viagem → gera `ASSET:LOCK` na disponibilidade do motorista (TTL 60s).
2. Motorista vê e confirma → consome lock, materializando a reserva permanente.
3. Motorista não responde → lock expira automaticamente após 60s, liberando a disponibilidade.
4. Se motorista confirma e depois não comparece: lançamento compensatório sinalizado na reputação.

**Checkout fiat ⊗ estoque:**
1. Cliente inicia compra → authorize no BaaS (terceiro, oráculo).
2. Sistema recebe confirmação BaaS → debita estoque local.
3. BaaS falha pós-authorize → compensação local reverte estoque.
4. Estoque falha pós-authorize-BaaS → compensação BaaS (chargeback ou reversal) via oráculo.

---

## §3 — Tier 2: 2PC com Locks TTL (Isolamento + Coordenador Confiável)

Quando exige-se isolamento de snapshot *e* há um coordenador confiável na rede:

- **Prepare:** Cada domínio cria seu `ASSET:LOCK`, valida o efeito local, vota "commit" ou "abort".
- **Commit:** Se todos votarem commit, coordenador sinaliza e cada perna consome seu lock.
- **Abort:** Se qualquer perna falha, coordenador sinaliza abort; todos os locks expiram via sinal (acelerado, não TTL).

### 3.1 Resolução do Bloqueio Clássico do 2PC

**O problema clássico:** Participante fica travado em locked state indefinidamente se coordenador cai pós-prepare.

**A solução aqui:** O TTL resolve. Se coordenador cai:
- Locks permanecem vivos por seu TTL.
- Se TTL expira sem commit explícito → abort automático via expiração.
- Janela em-dúvida = TTL (não indefinida).

**Coordenador legítimo:** O **validador declarado da linhagem de coordenação** — a autoridade dona do contexto (corporativo: back-office; P2P: agente eleito temporariamente). Não é um super peer contrabandeado: só faz liveness (decidir commit/abort); safety segue nos locks de cada domínio (cada perna valida sua serialização).

---

## §4 — Tier 3: HTLC (Hashlock + Timelock) — DECISÃO: NÃO IMPLEMENTAR

### 4.1 Motivo do Descarte

HTLC cobriria swaps valor-por-valor trustless entre partes sem coordenador. Descartado porque:

1. **Griefing inerente:** Contraparte tranca valor pelo timelock sem completar (revela intencionalidade adversarial, mas o valor continua travado).
2. **Escopo estreito:** Só swaps. Não modela sagas multileg genéricas.
3. **Reputação não mitiga:** Em trocas de alto valor, tiro único, entre estranhos, a dissuasão ex-post (reputação) é fraca.

**Declarar como decisão, não como vão acidental:** O domínio de swap trustless de **alto valor, tiro único, entre partes sem histórico** fica **explicitamente fora de escopo**, com risco aceito.

### 4.2 Mitigações para Regime Não-Coberto

Para operações que caem fora do Tier 1/2:

- **Mínimo de confiança ("se não confia, não inicia"):** Cada operação exige decisão humana sobre risco.
- **Reputação como dissuasão ex-post** (ver §6): fato negativo verificável no grafo, durável, com prova para o ofendido. Só tem dente com bond/caução.
- **Escrow por terceiro acordado** (opcional, quando justificado): intermediário confiável; reintroduz mini-coordenador, mas é transparente. Mais leve que HTLC, menos trustless, aceitável no regime jogo-repetido.

**Princípio honesto:** Onde não há confiança nenhuma e o valor é alto, **alguma âncora de confiança (autoridade, bond ou escrow) tem que entrar.** Não há almoço trustless grátis aqui — e é aceitável, porque **P2P puro é boost de resiliência, não foco absoluto.**

---

## §5 — Políticas de TTL (Selecionáveis por Processo)

Apresentadas como **opções de configuração da SPEC** (escolhidas ao desenhar cada saga), não default global. As quatro:

### 5.1 `fixed` — TTL Fixo

- TTL declarado na SPEC, constante para todas as sagas daquele tipo.
- Determinístico, simples de auditar e testar.
- Ex: ride-matching sempre 60s; checkout sempre 30s.

### 5.2 `per_leg` — TTL por Perna

- TTL distinto para cada perna (resposta humana: longo; confirmação de máquina: curto).
- Deadline efetivo = **mínimo das pernas ainda abertas**.
- Ex: passageiro 120s, motorista 60s → efeito 60s até motorista responder.

### 5.3 `renewable_lease` — Lease Renovável por Heartbeat

- Agente orquestrador mantém vivo via heartbeat/canário (canal efêmero).
- Morte do agente → não renova → expira.
- **Teto rígido de lifetime obrigatório (anti-grief):** a lease pode renovar-se, mas tem limite absoluto (ex: max 10 min, mesmo com renovação).
- Ex: sincronização de documento colaborativo com agente ativo.

### 5.4 `risk_scaled` — Escalado por Valor/Contenção

- TTL escalado dinamicamente por atributos do recurso.
- Ex: recurso disputado (muita contenção recente) → TTL curto; recurso de baixa demanda → TTL longo.
- Requer projeção local da "demanda percebida" — risco de gaming local, mitigado por revalidação periodicamente.

### 5.5 Bloco de Configuração SPEC

```yaml
saga:
  mode: "saga" | "2pc"                    # Tier 1 (default) | Tier 2 (coordenador confiável + isolamento)
  ttl_policy: "fixed" | "per_leg" | "renewable_lease" | "risk_scaled"
  
  # Para fixed:
  ttl: 60000                              # ms
  
  # Para per_leg:
  legs: [
    { name: "motorista", ttl: 60000 },
    { name: "passageiro", ttl: 120000 }
  ]
  
  # Para renewable_lease:
  lease:
    ttl: 10000                            # ms por período de renovação
    renew_via: "ephemeral"                # canal efêmero (websocket/datagram)
    max_lifetime: 600000                  # teto rígido (10 min)
  
  # Para risk_scaled:
  scale:
    by: "value" | "contention"
    min_ttl: 30000                        # ms
    max_ttl: 300000                       # ms
  
  # Geral:
  compensation: "compensating_entry"     # append-only; idempotente + retry
```

---

## §5.1 — Invariantes Transversais de TTL

### 5.1.1 Adjudicação pelo Validador-Dono da Linhagem

- A expiração é adjudicada pelo **validador-dono da linhagem do lock**, contra **o relógio dele** (HLC).
- **Não é instante computado globalmente:** o skew de relógio (limitado por `MAX_DRIFT`, caderno-2/02 §3.5.4) pode exceder TTLs curtos; a opinião dos outros peers é só dica de UI até o dono do lock agir.
- **Corolário:** No P2P puro, o peer que criou o lock é o juiz de sua expiração. Em corporativo, o validador é o servidor (sempre vivo, relógio sincronizado). Não há oracle de tempo global.

### 5.1.2 Corrida Confirm-vs-Expira

- Duas operações concorrentes na linhagem do lock: confirm (op normal de consumo) e expire (sinal de morte/lápide).
- **Ambas serializam pela regra de linhagem v4 §2.3:** apenas uma pode finalizá-se.
- Determinismo: a que chegar ao validador primeiro, com prova válida, vence. Não há "ambas expiram".

---

## §6 — Liquidação Social do Default Não-Cumprido (Reputação)

Quando uma operação cross-parte não pode ser atomicamente forçada, a UI e o grafo devem ser **honestos sobre garantia**.

### 6.1 Marcação Explícita de Risco

- Operações multidomínio no Tier 1 exibem tag "não-garantida / baseada em confiança" na UI.
- Não é ocultação de mecanismo; é honestidade sobre garantia.

### 6.2 Reputação Como Instrumento

Reputação só morde se:
- **A obrigação é estruturada no grafo com deadline** (não promessa off-graph).
- Registra-se como `CONTENT:INTENT` ou compromisso com prazo HLC.
- Não-cumprimento até deadline = **fato negativo verificável**, durável, com prova para o ofendido.
- Promessa fora do grafo = he-said-she-said, gameável, sem tração.

**Limite:** Reputação é **dissuasão ex-post, não proteção ex-ante.** Funciona em regimes:
- Jogo repetido (contrapartes reconhecidas).
- Valor limitado (perda é suportável).
- Falha em: one-shot / alto-valor / estranho (mesmo domínio do Tier 3 descartado).

### 6.3 Mecanismo: Bond e Rate-Limit

- **Com bond/caução:** sistema corta o bond do não-cumpridor (cortesia executável).
- **Sem bond:** fato negativo verificável + rate-limit (ser marcado no grafo, receber menos prioridade).
- **Equivalência:** O fato negativo é Sybil-resistant igual (não é possível "desver" desmentindo); punição do sistema só tem dente se há **custo estrutural de reputação** (bond) ou **custo de oportunidade** (rate-limit de acesso).

---

## §7 — Degeneração Sob Autoridade Forte

Em deployments com autoridade central (corporativo, pública), a multidomínio degenera:

- Autoridade = validador-dono de quase todos os recursos contendidos → as pernas compartilham um domínio.
- **Multidomínio vira single-domain (RFC v4 §2.4):** um `CONTENT:INTENT`, N `ASSET:LOCK`s transformam-se em **um `CONTENT:INTENT` com N `CREDITS` e N `SPENDS`**, uma única aprovação.
- **Consequência:** Não embutir maquinaria de saga **por padrão** em deployments corporativos. Deixar degenerar no fluxo simples já existente.

**Exceção:** A perna externa (BaaS, terceiro) continua cross-domínio. O **validador-ponte-BaaS é um oráculo** — a única classe de afirmação que o grafo aceita sem verificar (fato vive fora do grafo). Mitigado por:
- Bonding/redundância de oráculos (vários bridges, votação).
- Não por cripto (oráculo por definição é trusted input).

---

## §8 — Estado da Saga (Regra Inviolável)

O estado de coordenação (quais pernas reservadas/confirmadas) é **orquestração efêmera**:

- `pending` em projeção local não-replicada do agente orquestrador.
- Cada leg finalizado é durável normal (um `ASSET:LOCK` consumido = estado replicado via protocolo v4).
- **Opcionalmente**, após liquidação final: um `CONTENT:INTENT` consolidador "saga liquidada" vai ao grafo durável (um ponto de referência para auditoria).

**Regra inviolável:** Estado mutável replicado da saga é **proibido**. Não criar aresta com `state` mutável que circule entre peers. Reabriria o buraco do append-only que RFC v4 já fechou no PoA (RFC v4 §0.2 / §2.6).

---

## §9 — Registro de Validação

Os seguintes casos foram **validados como modeláveis sem alteração ontológica**, com seus limites honestos (detalhados em seção apropriada do backlog):

- **Fintech (compra de asset, reversão)**: assets já modelados; reversão = lançamento compensatório (natural no append-only); BaaS = oráculo; multi-perna cross-domínio = saga.
- **Ride-matching P2P**: reserva disponibilidade com TTL → confirma ou expira → próximo.
- **Checkout fiat ⊗ estoque**: authorize no BaaS → commit estoque → reverte se falhar.

---

## Apêndice — Fronteiras com os Cadernos

Edições relacionadas necessárias (commitadas separadamente):

1. **caderno-2/01 §2.2 e §3.3:** Registrar que `ASSET:LOCK` é output de operação de reserva numa saga; ancora no head via `SPENDS`.
2. **caderno-2/02 §2.1:** Reafirmar que `ASSET:PERMISSION` permanece declarativo. Não torná-lo executável.
3. **caderno-2/02 threat model:** Adicionar limites honestos: trava de visualização ≠ enforcement; expurgo ≠ revogação criptográfica.
4. **caderno-3/01 §3.3:** Registrar `ASSET:LOCK` como participante de sagas.
5. **caderno-3/01 §5:** Confirmar que ranking/busca consume `searchable: true` de SPEC (Zen), não nó novo.
6. **caderno-4/03:** Extensão multidomínio: invariante de core é per-perna; consistência cross-domínio é padrão.
7. **backlog-geral:** Primitivo de saga/2PC + TTL é pré-requisito para módulos financeiros compostos.
