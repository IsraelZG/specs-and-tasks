# RFC-010 — Protocolo de Plugins e Computação Distribuída
> **Status:** Proposta
> **Precedência:** cria o substrato de extensão da plataforma; **retro-fundamenta** `RFC-007` (um conector externo é uma categoria de plugin — ver A.3) e o `caderno-3-sdk/05-media-transport-plane.md` (renditions = utilitário assíncrono — ver A.5). Estende `caderno-4-governance/02-module-architecture-and-code-splitting.md` (monorepo: `core/plugins`, `ComputePort`). Onde não tocada, a doc vigente prevalece.
> **Decisões de entrada:** marketplace-only no modelo App Store/Play (validação como gate de oferta); critérios de validação por implementação (P2P puro livre tipo npm; rede pública criteriosa); redes white-label/P2P puras rodam **segregadas** → autoridade de assinatura de **nível único** por implementação; economia de tokens governada por SPEC (cobrança/negociação/“imposto de manutenção” variam por rede); IA/RAG/agentes saem para a RFC-011, que cabalga neste substrato.

## A.1 — Plugin como unidade distribuível

**Resolve:** o que é a unidade de código extensível, suas duas formas de runtime, e por que tudo (IA, codecs, conectores, signaling, SFU) cabe num modelo só.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/12-plugins-e-computacao.md` | novo | Documento canônico, §1 |
| `docs/conceitos/plugin.md` | novo verbete | Definição canônica |
| `docs/conceitos/capacidade-de-runtime.md` | novo verbete | `browser` vs `node`, anúncio por peer |

**Texto normativo:**

1. Um **plugin** é uma unidade de código assinada e versionada, declarada por um nó **`SPECIFICATION` (kind: `PLUGIN`)**. Ganha de graça linhagem ([[linhagem-de-versoes]]), assinatura do autor e distribuição por replicação/blob plane.
2. **Dois tipos por runtime exigido** ([[capacidade-de-runtime]]): `browser` (JS e/ou WASM, executa em contexto web — aba do usuário ou Worker) e `node` (executa em peer cloud ou no lado Node de um wrapper Electron/Capacitor). O tipo é propriedade do plugin; um plugin pode declarar-se isomórfico (ambos), mas o caso geral é um.
3. O manifesto do `SPEC:PLUGIN` declara: tipo(s) de runtime, **perfil de recurso** (GPU, RAM, ESM/threads), **assinatura**, e a lista de **capacidades** que expõe. Cada capacidade é um contrato tipado: `id` versionado, schema de entrada/saída, **flag de determinismo**, **classe de privacidade** (vê plaintext? — A.6).
4. O bundle binário (JS/WASM para `browser`; pacote para `node`) é transportado como blob pelo media plane (cifra por chunk, manifesto — caderno-3/05), referenciado pelo `SPEC:PLUGIN`. Código nunca trafega no payload de outros nós.

## A.2 — Distribuição marketplace-only e validação

**Resolve:** a fronteira de segurança "sem instalação externa" e como a validação varia por implementação.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/12-plugins-e-computacao.md` | §2 | Adicionar |
| `docs/conceitos/validacao-de-plugin.md` | novo verbete | Gate de oferta + critérios por modalidade |

**Texto normativo:**

1. **Única via de obtenção é o módulo Marketplace** (RFC de produto correspondente): plugin é uma classe de ativo negociável (modelo App Store / Play). Não existe sideload — o runtime só carrega bundles cuja procedência é um `SPEC:PLUGIN` válido, assinado e **listado** na implementação corrente. Carga por qualquer outro caminho é rejeitada.
2. **Validação é gate de oferta**, não de uso: para *listar* um plugin, ele passa pelo processo de validação da implementação. Os **critérios dependem da implementação** ([[modalidade-de-rede]]): P2P puro pode ser aberto como um registro npm; rede pública/corporativa pode exigir revisão criteriosa, análise estática, reputação do autor.
3. **Autoridade de nível único por implementação:** como redes white-label e P2P puras rodam **completamente segregadas** das públicas (cada implementação é um universo isolado com suas próprias regras), não há camada de assinatura global sobreposta — cada implementação é a autoridade soberana sobre o que aceita listar e carregar. A confiança não atravessa fronteiras de rede.
4. O runtime verifica assinatura + listagem **antes** de instanciar qualquer plugin; falha → `fato-negativo-verificável` de carga recusada, jamais execução degradada silenciosa.

## A.3 — Três categorias de capacidade; reconciliação com transporte e conectores

**Resolve:** por que LiveKit, signaling, conectores e codecs são todos plugins, e como isso se encaixa nas portas hexagonais.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/12-plugins-e-computacao.md` | §3 | Adicionar |
| `caderno-3-sdk/06-connectors.md` | §0 | Editar: declarar que conector é um plugin (tipo `node`, categoria `connector`) entregue/sandboxed por esta RFC |

**Texto normativo:**

Um plugin fornece uma de três categorias de capacidade:

| Categoria | Provê | Exemplos | Porta |
| :--- | :--- | :--- | :--- |
| `compute` | função invocável (determinística ou não) | LLM, embedding, transcrição, codec/transcode, efeito, OCR, função pura | `ComputePort` (A.4) |
| `connector` | ponte ao mundo externo (classes A–E da RFC-007) | BaaS, NF-e, email IMAP, geo | consome `NetworkAdapterPort` no site `external` |
| `infra` | serviço de infra que **carrega seus próprios canais de rede** (ou consome um adapter existente) | **signaling/rendezvous, SFU LiveKit, seeder/tracker WebTorrent, relay** | canais próprios do serviço |

**NetworkAdapter ≠ plugin.** São abstrações distintas e nenhuma contém a outra: NetworkAdapter é concern de **transporte** (como o *sync do grafo* — RBSR/Automerge — alcança peers), em larga medida **nativo** (o WebRTC do automerge-repo é nativo; o transporte base RBSR sobre WebSocket ao [[peer-do-sistema]] também). Plugin é concern de **capacidade**. Um plugin pode *consumir* um NetworkAdapter existente **ou abrir seus próprios canais** (dentro das portas de rede que o sandbox concede — A.6).

Consequências:

1. **Conector é um plugin** (tipo `node`, categoria `connector`): a RFC-007 define a *semântica* externa (oráculo, espelho, idempotência); esta RFC define a *entrega e o sandbox*. As duas compõem sem sobreposição.
2. **Plugins `infra` trazem o próprio transporte, por decisão explícita.** SFU LiveKit e WebTorrent abrem seus **próprios canais WebRTC**, independentes dos canais do Automerge. Foi avaliado reaproveitar os canais WebRTC do automerge-repo nessas funcionalidades e **decidido que não compensa** (conexões não são caras o bastante para justificar modificar LiveKit/WebTorrent a aceitar conexões pré-existentes). Logo não há recursão nem dependência circular de transporte: o sync do grafo é nativo; os serviços de infra são plugins que gerenciam sua própria rede em paralelo.
3. **Precisão sobre LiveKit (cliente embutido × SFU plugin).** O LiveKit é arquitetura **SFU-cêntrica**: o cliente sempre fala com um servidor LiveKit. Portanto o **SDK cliente** de chamadas vem **embutido** no app (first-party, default para áudio/vídeo), e o **SFU** é o plugin `infra` que o operador roda e que o LiveKit **exige** para funcionar (modality-gated). Em rede gerenciada/pública o operador sobe o SFU e as chamadas roteiam por ele; em **P2P puro sem operador/SFU**, não há LiveKit — cai-se em WebRTC bruto embutido para 1:1/grupos pequenos, e conferência grande não existe sem âncora (limite honesto). A categoria de plugins ganha ainda uma quarta entrada `ui` (frontend), definida na RFC-024.
4. **Sessão de sala é estado efêmero no grafo.** Uma sessão LiveKit publica um nó de sessão efêmero (TTL curto, governado por SPEC) com os participantes e o SFU corrente; na queda do plugin `infra` operador, os peers reconciliam por esse nó para religar — ao SFU substituto quando houver, ou a WebRTC bruto embutido dentro do limite de participantes. Sem nó de sessão vigente não há fallback automático: cai-se em `fato-negativo-verificável` de chamada interrompida.

## A.4 — ComputePort, sites de execução e casamento por capacidade de runtime

**Resolve:** o eixo "onde executa" e como o escalonador escolhe legalmente.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/12-plugins-e-computacao.md` | §4 | Adicionar |
| `caderno-4-governance/02-module-architecture-and-code-splitting.md` | §portas | Editar: adicionar `ComputePort` à lista de portas nomeadas |

**Texto normativo:**

1. Capacidade `compute` é invocada por `id` através da **`ComputePort`**, que resolve **site** e **modo** sem o chamador conhecer o backend (IoC, como o roteamento de conectores).
2. **Três sites:**
   - `local` — no dispositivo (browser plugin na aba/Worker; node plugin no Electron). Default local-first.
   - `peer` — peer remoto da malha que **anuncia** a capacidade via aresta [[serves]] e cujo perfil de runtime/recurso satisfaz o plugin (computação síncrona "em outro peer").
   - `external` — endpoint não-peer alcançado por **qualquer NetworkAdapter** declarado (não só REST: WS, datachannel, custom) — é o território dos conectores RFC-007.
3. **Legalidade por casamento de runtime:** cada peer anuncia seus runtimes (`browser`, `node`) e perfil de recurso. O escalonador só elege um site onde `plugin.runtime ⊆ site.runtimes` **e** o recurso cabe. Peer cloud headless oferece só `node`; Electron oferece ambos; peer web puro só `browser`. Não há combinação ilegal possível — a indisponibilidade de runtime simplesmente remove o site do conjunto elegível.
4. **A SPEC do fluxo chamador pode fixar restrições** (site permitido, modo, classe de privacidade máxima). Sem site elegível e sem fallback → `fato-negativo-verificável`, nunca execução em site proibido.

## A.5 — Dois modos: síncrono e fila assíncrona

**Resolve:** o eixo "como o chamador espera" e a unificação dos casos assíncronos hoje ad hoc.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/12-plugins-e-computacao.md` | §5 | Adicionar |
| `docs/conceitos/fila-de-computacao.md` | novo verbete | task=nó + claim por lock |
| `caderno-3-sdk/05-media-transport-plane.md` | §renditions | Editar: rendition é instância de utilitário `compute` assíncrono (linkar) |
| `docs/conceitos/consolidacao-de-live.md` | corpo | Editar: consolidação é utilitário `compute` assíncrono (linkar) |

**Texto normativo:**

1. **Síncrono:** request/response sobre o transporte do site (`local` in-process; `peer`/`external` sobre o adapter). Chamador aguarda dentro de um orçamento de tempo; estouro → aborto + fato negativo.
2. **Assíncrono (fila):** a invocação materializa uma **task = nó** governada por SPEC. Um worker elegível **reivindica via [[asset-lock]]**; a [[serialization-por-linhagem]] garante que dois workers não peguem a mesma task (de graça, mesmo mecanismo anti-oversell). O resultado é publicado como nó **assinado pela persona do executor** ([[agente-de-sistema]] quando system-peer), **idempotente** por chave de requisição (reentrega → no-op). O claim por [[asset-lock]] carrega **lease com heartbeat**: o worker renova o lock dentro de um intervalo curto governado por SPEC; expirado o lease sem renovação (ex.: aba do Browser Worker fechada), o lock é considerado solto e a task volta à fila para re-claim, sem intervenção. A idempotência por chave de requisição garante que re-claim após conclusão tardia seja no-op. O nó de resultado liga-se ao executor por aresta **`PERFORMED_BY`** (resultado → persona do worker assinante), tornando a procedência da computação consultável e insumo direto do registro auditável de A.7. O bundle binário é cacheável e expurgável localmente, mas o `SPEC:PLUGIN` que o produziu permanece imutavelmente referenciado por toda task que o invocou ([[linhagem-de-versoes]]): a procedência ('gerado pelo plugin X-vN') é auditável mesmo após o bundle sair dos caches.
3. **Unificação:** geração de renditions (transcode), [[consolidacao-de-live]] (gravação consolidada pelo system-peer) e embeddings (RFC-011) deixam de ser mecanismos avulsos e passam a ser **instâncias do modo assíncrono** deste protocolo.
4. **Determinismo declarado governa a verificação:** capacidade determinística admite verificação por re-execução amostral (resultado divergente entre executores = alerta); capacidade não-determinística (IA) opera no regime de confiança por assinatura do executor + reputação.

## A.6 — Sandbox, capacidades e classe de privacidade

**Resolve:** o teto de abuso de código de terceiros e a regra que protege plaintext.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/12-plugins-e-computacao.md` | §6 | Adicionar |
| `docs/conceitos/classe-de-privacidade.md` | novo verbete | Matriz classe × site elegível |

**Texto normativo:**

1. **Sem autoridade ambiente.** Browser plugin roda em Worker/WASM isolado: sem DOM (exceto via bridge de componente declarado — RFC-008 A.4), sem rede (exceto portas declaradas), sem storage direto. Node plugin roda em processo/isolate com capacidades escopadas por `ASSET:ROLE` da sua persona; acesso a grafo, rede e FS só pelas portas concedidas.
2. **Entrada e saída só pelo contrato:** o plugin recebe exatamente o schema de entrada declarado e devolve o de saída; não enxerga o grafo além do que a capacidade pede.
3. **Classe de privacidade × site:** o contrato declara se a capacidade vê plaintext sensível; cruzar a fronteira E2E (site `external`, ou `peer` fora do círculo de confiança) com dado de classe restrita é **proibido por construção** e exige consentimento explícito quando permitido. Exemplo normativo: cálculo de folha (rfc-014) jamais elegível a site `external`; transcode de vídeo público elegível a qualquer site.

## A.7 — Economia da computação (governada por SPEC)

**Resolve:** como o peer que oferece computação é (ou não) remunerado, sem fixar política no protocolo.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/12-plugins-e-computacao.md` | §7 | Adicionar |
| `docs/conceitos/economia-como-modulo.md` | corpo | Editar: computação servida e listagem de plugin são eventos econômicos governados por SPEC |

**Texto normativo:**

1. A remuneração por computação servida (`peer`) e por oferta/uso de plugin é **evento econômico governado por SPEC**, não regra fixa do protocolo. A plataforma prevê uma **economia de tokens**, mas *se* há cobrança, *como* se precifica/negocia, e a existência de um **"imposto" de manutenção da rede** são decididos pela SPEC econômica de cada implementação ([[economia-como-modulo]], [[modalidade-de-rede]]).
2. Implementações P2P puras podem operar a custo zero/cortesia; redes públicas/corporativas podem precificar via Zen Engine (por chamada, por recurso, por tempo) e reter imposto de rede. O protocolo apenas garante o **registro auditável** do trabalho servido (quem executou o quê, quando) como insumo de qualquer SPEC econômica.

## A.8 — Preparativos no plano

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-PL-01..06 |

**T-PL-01** `SPEC:PLUGIN` + manifesto + verificação de assinatura/listagem no loader (DoD Protocolo/core); **T-PL-02** sandbox browser (Worker/WASM, sem autoridade ambiente) + bridge de componente; **T-PL-03** sandbox node (processo/isolate, capacidades por `ASSET:ROLE`); **T-PL-04** `ComputePort` + escalonador com anúncio de runtime via [[serves]] + casamento de site (DoD Cloud); **T-PL-05** fila assíncrona (task=nó, claim por `ASSET:LOCK`, resultado assinado, idempotência) com utilitário fake no testkit; **T-PL-06** vetores adversariais (doutrina §0.1.7): bundle não-listado, plugin tentando rede fora das portas, dado de classe restrita roteado a `external`, dois workers na mesma task — todos com recusa comprovada.
