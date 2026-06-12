Este documento descreve os processos de governança, evolução e ciclo de vida das especificações (`SPECIFICATION`) da Plataforma V3.1, bem como as diretrizes de governança e sucessão de redes.

---

## 1. Ciclo de Vida e Versionamento de Specifications

As especificações (`SPECIFICATION`) atuam como o motor contratual e lógico da plataforma. Para garantir a rastreabilidade e integridade legal das regras históricas, **SPECIFICATIONs são imutáveis e nunca sofrem comandos UPDATE**.

### 1.1 Natureza Dual das Especificações
Cada especificação combina duas dimensões opcionais:
1. **Schema Declarativo**: Define a estrutura válida de propriedades de nós e arestas (definido via JSONSchema ou JSONLogic).
2. **Procedimento Executável (Zen Engine)**: Lógica computacional determinística executada no Sync Worker pelo interpretador **Zen Engine** (WASM/AST). Funciona sob quatro modalidades:
   * **Validações Locais**: Regras de interface locais (ex: comportamento do `SmartForm` antes de persistir alterações).
   * **Single-Validators**: Lógicas estruturais avaliadas e validadas por um único validador credenciado.
   * **Multi-sig**: Lógicas complexas que exigem quóruns de assinaturas M-de-N de múltiplos validadores ou agentes `PROFILE:SYSTEM`.
   * **Pontos de Rendimento e Escoamento BaaS**: Regras que disparam integrações ou requisições para gateways Backend-as-a-Service externos.

### 1.2 Regras de Versionamento SemVer
A evolução de qualquer especificação gera um novo nó no grafo ligado ao predecessor por uma aresta `SUPERSEDED_BY`, adotando a convenção de Versionamento Semântico (SemVer):

* **Patch (1.0.0 → 1.0.1)**: Correções textuais simples ou ajustes secundários que não afetam validações ou procedimentos.
* **Minor (1.0.1 → 1.1.0)**: Adições retrocompatíveis (ex: inclusão de um novo campo opcional no payload ou regras de validação mais permissivas).
  * **Migração**: O Sync Worker cria em lote arestas `MIGRATED_TO` apontando os registros antigos do grafo para a nova versão da especificação, sem necessidade de re-encriptar os payloads.
* **Major (1.1.0 → 2.0.0)**: Alterações incompatíveis (breaking changes - ex: remoção de campo obrigatório ou restrição de validação).
  * **Coexistência**: Dados antigos permanecem governados pela versão antiga (v1.x), preservando sua validade jurídica e histórica.
  * **Migração Causal Procedural (`migration_from_vN`)**: A especificação sucessora major (v2.0.0) pode carregar em seu payload uma regra procedural `migration_from_vN`. O Zen Engine executa essa lógica sobre os dados antigos para mapear propriedades, recalcular pesos e readequar arestas automaticamente para o novo contrato de dados, sem intervenção ou redigitação por parte do usuário.

### 1.3 Extensão de Especificações (Herança)
Especificações de redes específicas podem estender especificações canônicas da plataforma utilizando a aresta `EXTENDS`. A especificação filha herda todos os campos e validações do pai, adicionando suas próprias regras específicas (ex: `SPECIFICATION:NETWORK_PRODUCT` estende `SPECIFICATION:PRODUCT_CORE`).

---

## 2. Governança de Especificações Canônicas (RFCs)

O desenvolvimento das especificações canônicas de núcleo da plataforma segue o processo aberto de **RFCs (Request for Comments)**:

1. **Elaboração da RFC**: O proponente redige a especificação de regras em formato unificado Markdown.
2. **Período de Discussão**: A RFC é submetida a debate público no repositório de governança.
3. **Consenso e Aprovação**: A aprovação é dada por meio de votos assinados por um board de mantenedores ou quórum da comunidade open source.
4. **Publicação no Grafo**: A especificação aprovada é registrada no grafo como um nó `SPECIFICATION` com a assinatura do board.

---

## 3. Governança de Redes e Sucessão

Toda rede possui um nó debootstrap do tipo **`SPECIFICATION:NETWORK_GOVERNANCE`** que define a linha de sucessão e os validadores autorizados da rede:

### 3.1 Modelos de Governança
* **Top-down (Corporativa/Pública Tradicional)**: O fundador ou board centralizado detém o controle dos validadores e aprovações críticas de especificações de rede.
* **Híbrida/Comunitária**: Decisões operacionais residem com o consórcio fundador, mas alterações estruturais exigem quórum de votos criptográficos assinados pelos peers da rede.

### 3.2 Linha de Sucessão e Dissolução de Superpoderes
* **Sucessão por Quórum**: Linha de sucessão M-de-N de assinaturas declarada na gênese para assumir a governança em caso de incapacidade técnica do fundador.
* **Dissolução de Poderes**: O fundador de uma rede pública pode alterar de forma irreversível a `SPECIFICATION:NETWORK_GOVERNANCE` para abrir mão de seus poderes e transferir a validação para um modelo P2P puro distribuído ou base de votação.

### 3.3 Morte da Rede por Leis da Física
Diferente de sistemas tradicionais, a plataforma **não necessita de código específico para desativar ou congelar redes** (ex: falecimento ou sumiço do fundador sem sucessor).
* **Paralisia Natural**: Se os validadores autorizados ficam permanentemente offline, as transações não-comutativas (transferências de saldo, decremento de estoque) falham na validação por falta de assinaturas legítimas. A rede entra em estado read-only por leis físicas de design. As interações comutativas (chats, edições de rascunhos) continuam operando normalmente entre os peers ativos.

### 3.4 Tradeoff de Liveness dos Validadores (Formalização)

O comportamento da §3.3 é **intencional e defensável** — documentado como propriedade, não tratado como defeito a mitigar.

* ✅ **Operações comutativas** (leitura, gossip, RBSR, navegação, chats, rascunhos): funcionam **independentemente** de validadores. A rede nunca perde a capacidade de ler e disseminar dados.
* ⚠️ **(Atualização v4 — congelamento escopado por linhagem.)** Operações não-comutativas são serializadas pelo validador declarado **daquela linhagem** (§3.5). Sob partição, a linhagem cujo validador/quórum está inalcançável **congela escopadamente** — apenas aquele ativo, não a rede inteira — e **não** há eleição de substituto sem cerco (a eleição de emergência a 2/3 da V3.1 é **removida**, pois reintroduziria split-brain → double-spend). Linhagens cujo validador está alcançável seguem normalmente. O freeze deixa de ser de rede e passa a ser por ativo: mais granular e estritamente mais seguro que o modelo V3.1.
* 🔒 **Segurança:** a degradação para read-only **não corrompe dados, não permite operações inválidas e não perde auditabilidade**. É um *freeze*, não um *crash*.
* 📐 **Projetado para:** redes onde auditabilidade e integridade importam mais que disponibilidade transacional de 100% em cenário de desastre (corporativas, financeiras, reguladas).

**Esclarecimento sobre o "SPOF":** validadores **não** são uma unidade singular. A arquitetura especifica um conjunto K-de-N de entidades independentes (Super Peers, Cloud, Desktops de alta disponibilidade). A liveness exige apenas **1** online, não todos. O cenário de extinção total dos validadores é, por definição, a morte natural da rede já prevista nesta seção.

**Reconciliação de forks sob ausência de validadores:** O modelo de fork (duas arestas `MUTATES` concorrentes com o mesmo `source_id`) é detectado estruturalmente pelo RBSR mesmo sem validadores — o protocolo identifica e registra a divergência. Contudo, o **merge** (criação do nó de resolução) exige ao menos um peer capaz de executar a operação de committer (idealmente um validador ou Super Peer). Sem validadores disponíveis, os forks ficam registrados no grafo mas **não resolvidos** até que um validador retorne. Isso é consistente com o tradeoff de liveness: operações comutativas (RBSR, leitura, detecção) progridem; operações não-comutativas (merge de fork, emissão de nó de merge), não.

### 3.5 Serialização por Linhagem (v4)

Operações não-comutativas (débito de `ASSET:BALANCE_STATE`, emissão de `ASSET:PERMISSION`, alteração de `SPECIFICATION`) são serializadas **por linhagem de ativo**, substituindo o quórum global de validadores e a eleição de emergência a 2/3.

**Invariante de Core (inviolável, não-configurável por SPEC):**

> Duas escritas conflitantes na mesma linhagem não-comutativa **não podem** ambas chegar ao estado `finalized`.

O core a enforça verificando a evidência (≥K aprovações válidas do conjunto declarado, ancoradas ao head consumido via `SPENDS`) e detectando colisões. **Não pode** ser definida por SPEC: SPEC é dado mutável e não-confiável (mesma doutrina de caderno-2/02 §2.1, que nunca consulta payload de SPEC para validação de acesso); o modo de falha de um `k=0` seria cunhagem silenciosa; e a accountability exige invariante conhecida pelo core.

**Política (declarada na SPEC do ativo)** — formaliza/estende as modalidades `Single-Validators` e `Multi-sig M-de-N` da §1.1:

```yaml
serialization:
  mode: "leader" | "quorum"
  set: [validator_ids…] | "custody_ring"   # fallback: anel de custódia determinístico
  k: N
  fault_model: "crash" | "byzantine"
  lease: { ttl, renew_quorum }              # apenas no modo leader
```

* **K=1 (Single-Validator) é o caso comum** (cashback, fidelidade, maioria dos não-financeiros). A posse da linhagem é **determinística** (`hash(entity_id)` → um agente do conjunto), nunca pega-quem-agarra-primeiro. A fila efêmera do grupo distribui linhagens diferentes (load-balancing) e sinaliza liveness; dentro de uma linhagem, sempre o mesmo dono.
* **Leader vs. Quorum = quando se paga o quórum.** `leader` (Raft-like) amortiza o quórum numa lease e serializa muitas ops baratas; líder sem lease é inseguro sob partição. `quorum` (por op, `K > N/2` crash ou `K ≥ 2f+1, N ≥ 3f+1` bizantino) é seguro sob partição por construção.
* **Finalização pelo aplicador determinístico** (menor `entity_id` entre os aprovadores), não "o N-ésimo" — evita duplicação.
* **Evidência inline**, não agregada (BLS), para preservar atribuição individual e permitir corte de caução.

**Defaults por modalidade:** Corporativa → `leader` (super peer); Pública → `quorum` licenciado; P2P puro → `quorum` bizantino sobre anel de custódia.

**Extensão multidomínio (v4):** Quando uma operação envolve múltiplas linhagens de domínios distintos (sagas transdomínio), a invariante de core permanece **por-perna**: cada leg respeita sua serialização conforme a SPEC do seu ativo. **Consistência cross-domínio é padrão de composição (protocolo), não primitiva de core.** Oferece-se dois tiers: Tier 1 (Saga com `ASSET:LOCK` TTL, eventual + sans-isolamento, default) e Tier 2 (2PC com coordenador confiável, isolamento de snapshot). Ver rfc-transacoes-multidominio.md §1, §7.

---

## §4 Economia como Módulo ASSET (Medição vs. Liquidação)

A economia de contribuição é **um** modelo econômico entre vários que o ASSET viabiliza — não primitiva do core:

- **Core entrega [[contribuicao-verificavel|medição verificável]]** (os quatro regimes do §3.3): recibos, provas de storage, amostras de compute → um registro assinado e auditável de trabalho feito.
- **Liquidação** (virar crédito interno, fiat/remuneração real, ou só reputação) é decisão de SPEC por rede/módulo, via [[zen-engine|Zen Engine]]. A regra "contribuição → crédito" é procedimento na SPEC, não no core.

Isto resolve o regresso de mint da v4 anterior: o nó de contribuição é assinado pelo agente e ancorado em evidência verificável sob demanda (spot-check de recibo/storage), **não** pré-auditado por K=5 recursivo. E atende ao objetivo de **múltiplas economias**: o mesmo mecanismo roda a economia de pontos de um módulo de fidelidade e a economia de contribuição da rede.

A concepção de [[economia-como-modulo]] permite que cada rede escolha sua própria estratégia de remuneração sem repercussões no core, tornando a plataforma agnóstica a modelos econômicos específicos enquanto garante auditabilidade de qualquer contribuição medida.

---

## §5 Defesa Sybil (P2P puro — módulos opt-in)

A defesa **primária** é o **custo de criação de identidade** (v3.1 §1.4), **separado da economia**. A economia só mede contribuição; ela coludiria se fosse a defesa (Sybils contribuindo entre si). Stack para P2P puro (módulos opt-in via SPEC):

- **Convite-como-`ASSET:INVITE`**: saldo finito, emissão restrita, **gateada por [[standing]]** (mais convites por ser bom cidadão). Converte "100 identidades já" em "fluxo lento gateado por contribuição real". Rate limiter, não muro.
- **Responsabilização do convidante (staking social)**: convidou quem comete mau ato verificável → sua reputação leva o golpe.
- **Irrelevância por diversidade**: contribuição só conta servindo contrapartes **distintas e independentemente reputadas**. 1000 Sybils servindo uns aos outros = ~0 de standing. Mata a fome, não a existência.
- **[[bond-caucao|Bond/caução]] para papéis privilegiados** (validador/custódio): mau comportamento corta a caução. É aqui que a economia ganha papel de **segurança** legítimo — bonding, não gating de participação básica.
- **Detecção topológica** (SybilGuard/SybilLimit): real mas pesada, exige visão quase-global — natural como add-on da **autoridade** (mais um recurso das modalidades gerenciadas).

**Teto honesto:** nenhum sistema P2P puro resolve Sybil sem âncora confiável ou recurso real-escasso. A alegação correta é "resistente o bastante para ser padrão-ouro e servir deployments tolerantes a confiança", **não** "Sybil-proof". Em redes comerciais, Sybil está resolvido na porta (identidade verificada).

---

## §6 Remuneração e Telemetria

A remuneração (tráfego, armazenamento, **processamento** — validações, análises, modelos de IA locais) é a liquidação da medição do §3.3, governada por SPEC. A fronteira honesta: **medir** pode ser quase-trustless; **liquidar em dinheiro** é decisão de negócio e jurídica por rede, e não deve fingir propriedade criptográfica. As duas primeiras dimensões (banda/storage) são quase-trustless; a terceira (compute determinístico) é probabilística; a quarta (compute não-determinístico) é [[reputacao-local|mercado de reputação]].



---

## §7 Threat Model

> Origem: rfc-v4 §5.1–5.3 (absorvida em 2026-06-11). Tabelas normativas movidas literalmente.

### 7.1 Coberto pelo Design

| Ameaça | Proteção | Eficácia |
| :--- | :--- | :--- |
| Agente adultera payload | Assinatura original do usuário quebra → rejeitado | ✅ Total |
| Agente adultera resultado verificável (merge, validação) | Auditoria + [[desafio-canary|desafio canary]] detectam | ✅ Forte |
| Double-spend (mesma rede) | [[serialization-por-linhagem|Serialização por linhagem]]; conflitos ao mesmo validador | ✅ Total em operação normal |
| Double-spend sob partição | [[congelamento-escopado|Congelamento escopado]] à linhagem (sem failover não-cercado) | ✅ Total (custo: liveness daquele ativo) |
| Auditor não pode ler saldo cifrado | [[validador-declarado|Validador declarado]] já é custódio com a chave | ✅ Resolvido |
| Validador finaliza em duplicado | [[aplicador-deterministico|Aplicador determinístico]] (não "o N-ésimo") | ✅ Total |
| Validador mente/duplo-assina | Falta autocomprovável → [[bond-caucao|caução]] cortada | ✅ Total (responsabilização) |
| Telemetria autorreportada falsa | Recibo de contraparte / desafio / amostra | ✅ Nas dimensões verificáveis |
| Peer parasitário | Irrelevância por diversidade; PCR opcional | 🟡 Econômica |

### 7.2 Aceito como Risco

| Ameaça | Por que aceito |
| :--- | :--- |
| Agente substituído por versão maliciosa | TEE/TPM impediria; design optou por detecção pós-hoc (auditoria + canary) |
| Insider que relaya conteúdo a um bloqueado | [[bloqueio-social|Bloqueio]] é criptográfico contra o bloqueado **sozinho**; nunca contra um insider colaborador |
| Conjunto bizantino comprometido além do limiar | "A rede já está comprometida"; o quórum recomendado torna o caso normal impossível |
| Trapaça em compute não-determinístico bem desenhada | Desafio canary é fraco aqui; vira mercado de reputação com disputa |

### 7.3 Território de Pesquisa (não tratado como assentado)

- **Verificação trustless de compute não-determinístico** (IA local) — fica como mercado de reputação, não ledger provado.
- **Transferência atômica entre tipos/emissores de ativo distintos** — exige validadores de ambos os lados; modelagem futura.
- Qualquer pretensão de **bloqueio criptográfico de conteúdo público** — declarado impossível, não a implementar.
