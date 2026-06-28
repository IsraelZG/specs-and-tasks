# 24-workflow-reference-spec.md — Workflow e Orquestração de Processos

> Fonte: RFC-022 (absorvida e deletada). Transversal; retro-fundamenta a engine `StateMachine` (caderno-3/03) e a saga de transações multidomínio (RFC-012 A.4). Zero tipo de nó novo — workflow é `SPECIFICATION`; o estado de execução é projeção.

---

## §1 — Workflow como SPECIFICATION + execução event-sourced

1. Um processo é um nó **`SPECIFICATION` (kind: `WORKFLOW`)** cujo payload é a definição da máquina de estados (formato próprio, A.4/A.5). Herda linhagem, assinatura, governança, customização por `EXTENDS` e jurisdição (RFC-009) — exatamente como a linguagem de páginas (RFC-008).
2. **Estado de execução = projeção, não nó mutável.** Uma *instância* de workflow tem seu estado **derivado da linhagem dos eventos finalizados** daquela instância (event sourcing). Reabrir/reconstruir = re-fold dos eventos. Isso herda a regra inviolável da saga (RFC-012 A.4.6): nada de aresta com `state` mutável replicado — só pernas finalizadas vão ao grafo; o "estado atual" é leitura derivada.
3. **Orquestrador = liveness, nunca safety.** Quem avança a instância é o validador declarado da linhagem de coordenação; a safety segue nas primitivas (A.2), não no orquestrador. Sem super-peer contrabandeado.
4. **Pin de versão por instância.** Uma instância de workflow executa até o fim sob a versão de `SPEC:WORKFLOW` sob a qual nasceu; um supersede da SPEC **não** migra instâncias in-flight nem re-funde eventos passados sobre a nova máquina. Novas instâncias usam a versão vigente. A versão de origem é parte da linhagem da instância e é resolvida no fold.

---

## §2 — Primitivas reusadas (a engine é fina porque o difícil já existe)

Uma engine de workflow é "execução durável + decisões + timers + ações + compensação". Cada peça já existe no projeto; a engine apenas as compõe atrás do formato:

| Necessidade do workflow | Primitiva existente |
| :--- | :--- |
| Estado durável / recuperável | Grafo append-only = event log (event sourcing nativo) |
| Decisões / guardas | Zen Engine (determinístico, total, sem I/O) |
| Timers / prazos | Deadline HLC |
| Compensação / rollback | Saga `ASSET:LOCK` + TTL (RFC-012 A.4) |
| Ação que muda o mundo | Emissão de `CONTENT:INTENT` pelo pipeline normal |
| Tarefa humana | Intent aguardando `APPROVED_BY` |
| Sinal / evento externo | Intent/evento de entrada |

Consequência: não construímos um motor durável do zero (o que o Temporal vende como produto); compomos primitivas já existentes. O que resta escrever é o **interpretador** (A.3).

---

## §3 — A engine: interpretador e envelope de segurança

1. O interpretador recebe **configuração atual + evento** e calcula **próxima configuração + ações a emitir**. É determinístico e total; cada passo opera sob orçamento de recurso (profundidade, nº de transições por macrostep, tamanho de guarda — limites como dado de SPEC, igual ao L3 das páginas).
2. **Envelope de segurança (autor não-confiável, como nas páginas/plugins):** guardas só referenciam **decisões Zen registradas**; ações só emitem **intents** pelo pipeline (nunca JS inline, nunca chamada de rede direta); transições nunca elevam privilégio — o intent é assinado pela persona do principal e validado normalmente. Workflow malicioso no máximo *propõe* o que o pipeline rejeita.
3. **Validação estática** (schema + envelope + orçamento) na autoria, na ingestão e antes de executar — igual ao validador do dialeto de páginas (RFC-008 A.7).

---

## §4 — Nível 1: Máquina de estados rasa

O **Nível 1** é uma máquina de estados finita simples, suficiente para a esmagadora maioria dos processos de negócio (pedido, despacho, cobrança, aprovação). Inclui:

- **Estados** nomeados; um (ou poucos) estado(s) ativo(s) por vez.
- **Transições** disparadas por evento, com **guarda Zen** opcional.
- **Ações de entrada/saída** por estado (emissão de intent).
- **Timers**: transição disparada por deadline HLC (timeout/SLA). Mesmo em cenários P2P puros, para evitar que timers fiquem órfãos quando o peer orquestrador se desconecta, os eventos de workflow temporizados (e de calendário que exigem trigger) utilizam a **esteira de processamento assíncrono (Job Queue)** da plataforma. Esses agendamentos são registrados no grafo e processados por **agentes de sistema** (rodando em peers ativos ou superpeers que agem em benefício da rede) sem vazar dados para terceiros. Se a esteira estiver offline ou inacessível no momento, o disparo ocorre retroativamente assim que qualquer peer da linhagem se conectar.
- **Estado composto raso**: aninhamento de **um nível** (um estado pode agrupar sub-estados sequenciais), com sub-workflow por **referência** a outro `SPEC:WORKFLOW`.
- **Escalonamento de tarefa humana**: um estado que aguarda `APPROVED_BY` declara um deadline HLC de escalonamento; ao expirar sem aprovação, a transição de timeout encaminha a tarefa ao alvo de fallback declarado na SPEC (ex.: `root`/supervisor) ou a um estado de exceção. Assim um aprovador inexistente nunca tranca a saga indefinidamente — herda a mecânica de timer dos timers acima. Qualquer tarefa humana deve declarar obrigatoriamente na `SPEC` um `timeout` e uma `política de escalonamento` (ex.: escalonar para supervisor ou emitir alerta de exceção), impedindo o bloqueio indefinido da transação.

**Exclui** (e é isso que o mantém simples): regiões paralelas/ortogonais; history (shallow/deep); eventos internos com propagação/bubbling; transições arbitrárias entre níveis de hierarquia. A configuração ativa é, no Nível 1, essencialmente **um estado** (+ contexto), o que torna o fold de event sourcing trivial.
- **Invariabilidade de Versão In-Flight**: Instâncias de workflow em execução (*in-flight*) estão permanentemente vinculadas (pin) à versão da `SPEC:WORKFLOW` sob a qual foram iniciadas. Atualizações na especificação do workflow só afetam novas instâncias, garantindo previsibilidade e consistência transacional.

---

## §5 — Nível 2: Statechart Harel completo

O **Nível 2** é o statechart de Harel completo, com semântica canônica do **SCXML (W3C)** — adotada como referência de algoritmo para não reinventar. Adiciona sobre o Nível 1:

- **Regiões paralelas (ortogonais)**: múltiplos estados ativos simultâneos; a configuração ativa vira um **conjunto** de estados.
- **Hierarquia profunda** (aninhamento arbitrário) e transições inter-nível.
- **Pseudo-estados**: history (shallow/deep), junction, **fork/join**, choice, estados iniciais/finais compostos.
- **Eventos internos** com fila e **propagação/bubbling**; loop microstep/macrostep do SCXML.
- **Entry/exit em cascata** (cálculo de conjunto de saída/entrada via ancestral comum — LCA), **deferred events**.

É necessário só para fluxos genuinamente concorrentes/reativos complexos; processos de negócio lineares **não** precisam dele.

---

## §6 — Diferenças registradas (Nível 1 × Nível 2)

| Dimensão | Nível 1 (rasa) | Nível 2 (Harel completo) |
| :--- | :--- | :--- |
| Estados ativos | Um por vez (+ pai raso) | Conjunto (regiões ortogonais) |
| Hierarquia | 1 nível (composto raso) | Arbitrária, com transição inter-nível |
| Concorrência | Não (use sub-workflows) | Sim (regiões paralelas) |
| History (retomar onde parou) | Não | shallow + deep |
| Pseudo-estados (fork/join/choice/junction) | Não | Sim |
| Eventos | Externos | Externos + internos com bubbling, fila micro/macrostep |
| Configuração (event sourcing) | Fold para **um estado** | Fold para **conjunto de estados** |
| Algoritmo de transição | Casar evento + guarda → disparar | Algoritmo SCXML (LCA, conjuntos entrada/saída, conflito, microstep) |
| Risco de implementação | Baixo (centenas de LOC, clássico) | Alto (semântica intrincada, fácil errar) |
| Cobre quanto dos processos de negócio | ~90% | os ~10% concorrentes/reativos |
| Mermaid | `stateDiagram` direto | `stateDiagram` com concorrência (`--`) e compostos |

**Regra de design que torna a migração barata:** o Nível 1 é definido como **subconjunto estrito (sintático e semântico) do Nível 2**. Consequência: ao ganhar o Nível 2, **nenhum workflow autorado em Nível 1 precisa migrar** — continua válido e executando igual; só a *capacidade da engine* cresce.

---

## §7 — Orçamento de migração Nível 1 → Nível 2

O esforço de evoluir do Nível 1 para o Nível 2 está **concentrado no interpretador** e é **aditivo** — porque tudo que é caro de construir é compartilhado e já fica pronto no Nível 1.

**Fundação compartilhada (custo pago uma vez, no Nível 1, reusada inteira no Nível 2 — esforço adicional ZERO na migração):** substrato de event sourcing sobre o grafo, integração com Zen (guardas), saga/TTL (compensação), pipeline de intents (ações), deadlines HLC (timers), andaime de `SPEC`-como-dado + validador, e o pipeline de geração Mermaid. Isso é a maior parte do trabalho total da engine, e não se refaz.

**Delta do Nível 2, por componente:**

| Componente | Esforço adicional | Por quê |
| :--- | :--- | :--- |
| Schema/formato `SPEC:WORKFLOW` | Baixo | Estender o schema com regiões, pseudo-estados, history (aditivo) |
| Validador estático | Baixo–Médio | Novas regras de boa-formação (fork/join consistente, alvo de history válido) |
| **Interpretador** | **Alto — domina o custo** | Trocar "estado único + casar transição" pelo algoritmo SCXML: configuração-conjunto, LCA, conjuntos de entrada/saída, resolução de conflito de transição, loop microstep/macrostep, fila de eventos internos, restauração de history |
| Projeção de estado (fold) | Médio | Reconstruir conjunto-configuração e history ao re-fold da linhagem |
| Geração Mermaid | Baixo | Mapear regiões/compostos para `stateDiagram` concorrente (Mermaid já suporta) |
| Testes / vetores adversariais | Médio–Alto | Corrida entre regiões, correção de history, ordenação de evento interno, fork/join |

**Resumo do orçamento:** o item dominante é o **interpretador** (Alto); todo o resto é Baixo a Médio. **De-risco recomendado:** implementar o interpretador do Nível 2 **conforme o algoritmo de interpretação do SCXML** (pseudocódigo público do W3C) em vez de inventar semântica — transforma "alto risco de erro sutil" em "transcrição cuidadosa de um algoritmo especificado". E, pela regra do A.6, **a migração não toca os workflows já escritos** — é puramente trabalho de engine, agendável quando (e se) um caso concreto exigir concorrência real. Até lá, o Nível 1 entrega ~90% sem custo do Nível 2.

---

## §8 — Exibição via Mermaid

1. A definição `SPEC:WORKFLOW` gera **deterministicamente** um diagrama Mermaid (`stateDiagram-v2` ou `flowchart`): estados→nós, transições→arestas, guardas→rótulos; Nível 2 usa concorrência (`--`) e estados compostos. Reusa o renderizador Mermaid da suíte office.
2. **Ressalva honesta — Mermaid é vista, não modelo:** desenha estados e transições, mas não captura fielmente guardas Zen, compensação e timers. É leitura/documentação; a **fonte da verdade é o `SPEC:WORKFLOW`**. Edição visual rica (arrastar nós) é, mais tarde, um componente de página (RFC-008), não o Mermaid-renderer.

---

## §9 — Limites honestos

1. Estado de orquestração é efêmero-mas-reconstruível (projeção), nunca nó mutável replicado — disciplina herdada da saga.
2. A engine executa definições de autores não-confiáveis em rede pública; a segurança vem do envelope (A.3.2), não de confiança no autor.
3. O Nível 2 tem risco de implementação real (semântica SCXML intrincada); o de-risco é seguir o algoritmo especificado, e adiá-lo até haver caso concreto.
