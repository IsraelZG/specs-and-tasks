# 12-plugins-e-computacao.md — Protocolo de Plugins e Computação Distribuída

> Fonte: RFC-010 (absorvida e deletada). Substrato de extensão da plataforma; retro-fundamenta RFC-007 (conector é categoria de plugin) e caderno-3/05 (renditions = utilitário assíncrono). Estende caderno-4/02 (monorepo: `core/plugins`, `ComputePort`).

---

## §1 — Plugin como Unidade Distribuível

1. Um **plugin** é uma unidade de código assinada e versionada, declarada por um nó **`SPECIFICATION` (kind: `PLUGIN`)**. Ganha de graça linhagem ([[linhagem-de-versoes]]), assinatura do autor e distribuição por replicação/blob plane.
2. **Dois tipos por runtime exigido** ([[capacidade-de-runtime]]): `browser` (JS e/ou WASM, executa em contexto web — aba do usuário ou Worker) e `node` (executa em peer cloud ou no lado Node de um wrapper Electron/Capacitor). O tipo é propriedade do plugin; um plugin pode declarar-se isomórfico (ambos), mas o caso geral é um.
3. O manifesto do `SPEC:PLUGIN` declara: tipo(s) de runtime, **perfil de recurso** (GPU, RAM, ESM/threads), **assinatura**, e a lista de **capacidades** que expõe. Cada capacidade é um contrato tipado: `id` versionado, schema de entrada/saída, **flag de determinismo**, **classe de privacidade** (vê plaintext? — A.6).
4. O bundle binário (JS/WASM para `browser`; pacote para `node`) é transportado como blob pelo media plane (cifra por chunk, manifesto — caderno-3/05), referenciado pelo `SPEC:PLUGIN`. Código nunca trafega no payload de outros nós.

---

## §2 — Distribuição Marketplace-Only e Validação

1. **Única via de obtenção é o módulo Marketplace** (RFC de produto correspondente): plugin é uma classe de ativo negociável (modelo App Store / Play). Não existe sideload — o runtime só carrega bundles cuja procedência é um `SPEC:PLUGIN` válido, assinado e **listado** na implementação corrente. Carga por qualquer outro caminho é rejeitada.
2. **Validação é gate de oferta**, não de uso: para *listar* um plugin, ele passa pelo processo de validação da implementação. Os **critérios dependem da implementação** ([[modalidade-de-rede]]): P2P puro pode ser aberto como um registro npm; rede pública/corporativa pode exigir revisão criteriosa, análise estática, reputação do autor.
3. **Autoridade de nível único por implementação:** como redes white-label e P2P puras rodam **completamente segregadas** das públicas (cada implementação é um universo isolado com suas próprias regras), não há camada de assinatura global sobreposta — cada implementação é a autoridade soberana sobre o que aceita listar e carregar. A confiança não atravessa fronteiras de rede.
4. O runtime verifica assinatura + listagem **antes** de instanciar qualquer plugin; falha → `fato-negativo-verificável` de carga recusada, jamais execução degradada silenciosa.

---

## §3 — Quatro Categorias de Capacidade; Reconciliação com Transporte e Conectores

Um plugin fornece uma de quatro categorias de capacidade:

| Categoria | Provê | Exemplos | Porta |
| :--- | :--- | :--- | :--- |
| `compute` | função invocável (determinística ou não) | LLM, embedding, transcrição, codec/transcode, efeito, OCR, função pura | `ComputePort` (A.4) |
| `connector` | ponte ao mundo externo (classes A–E da RFC-007) | BaaS, NF-e, email IMAP, geo | consome `NetworkAdapterPort` no site `external` |
| `infra` | serviço de infra que **carrega seus próprios canais de rede** (ou consome um adapter existente) | **signaling/rendezvous, SFU LiveKit, seeder/tracker WebTorrent, relay** | canais próprios do serviço |
| `ui` | interface renderizável | componentes de UI de terceiros, widgets em sandbox, games | bridge postMessage isolada (RFC-024 / [[caderno-3-sdk/26-plugins-frontend]]) |

**NetworkAdapter ≠ plugin.** São abstrações distintas e nenhuma contém a outra: NetworkAdapter é concern de **transporte** (como o *sync do grafo* — RBSR/Automerge — alcança peers), em larga medida **nativo** (o WebRTC do automerge-repo é nativo; o transporte base RBSR sobre WebSocket ao [[peer-do-sistema]] também). Plugin é concern de **capacidade**. Um plugin pode *consumir* um NetworkAdapter existente **ou abrir seus próprios canais** (dentro das portas de rede que o sandbox concede — A.6).

Consequências:

1. **Conector é um plugin** (tipo `node`, categoria `connector`): a RFC-007 define a *semântica* externa (oráculo, espelho, idempotência); esta RFC define a *entrega e o sandbox*. As duas compõem sem sobreposição.
2. **Plugins `infra` trazem o próprio transporte, por decisão explícita.** SFU LiveKit e WebTorrent abrem seus **próprios canais WebRTC**, independentes dos canais do Automerge. Foi avaliado reaproveitar os canais WebRTC do automerge-repo nessas funcionalidades e **decidido que não compensa** (conexões não são caras o bastante para justificar modificar LiveKit/WebTorrent a aceitar conexões pré-existentes). Logo não há recursão nem dependência circular de transporte: o sync do grafo é nativo; os serviços de infra são plugins que gerenciam sua própria rede em paralelo.
3. **Precisão sobre LiveKit (cliente embutido × SFU plugin).** O LiveKit é arquitetura **SFU-cêntrica**: o cliente sempre fala com um servidor LiveKit. Portanto o **SDK cliente** de chamadas vem **embutido** no app (first-party, default para áudio/vídeo), e o **SFU** é o plugin `infra` que o operador roda e que o LiveKit **exige** para funcionar (modality-gated). Em rede gerenciada/pública o operador sobe o SFU e as chamadas roteiam por ele; em **P2P puro sem operador/SFU**, não há LiveKit — cai-se em WebRTC bruto embutido para 1:1/grupos pequenos, e conferência grande não existe sem âncora (limite honesto). A categoria de plugins ganha ainda uma quarta entrada `ui` (frontend), definida na RFC-024.
4. **Sessão de sala é estado efêmero no grafo.** Uma sessão LiveKit publica um nó de sessão efêmero (TTL curto, governado por SPEC) com os participantes e o SFU corrente; na queda do plugin `infra` operador, os peers reconciliam por esse nó para religar — ao SFU substituto quando houver, ou a WebRTC bruto embutido dentro do limite de participantes. Sem nó de sessão vigente não há fallback automático: cai-se em `fato-negativo-verificável` de chamada interrompida.

### Archetype: context-plugin

1. **context-plugin** (ou "Headroom TS") é um archetype de plugin `browser`, categoria `compute`: executa parse, compressão e enriquecimento de contexto sem sair do dispositivo — preserva [[classe-de-privacidade]] por construção, nunca trafega plaintext para fora da fronteira local (site `local`, conforme [[capacidade-de-runtime]] nomeia).
2. **Parse de AST via WASM:** emprega `web-tree-sitter` (WASM isolado) para recuperar a árvore sintática do código do projeto do usuário em tempo linear — leitura de estrutura sem tradução de valores. O AST permanece em memória do processo chamador.
3. **Compressão e poda:** antes de invocar uma capacidade de IA remota (compute site `external`, categoria `connector`), o plugin reduz o contexto excluindo imports intraprovedores, comentários bloqueados e formatação redundante, cortando tokens sem perder semântica de código.
4. **Embeddings locais sem traço:** gera vetores semânticos direto em memória via `Transformers.js` (WASM ou WebGPU nativo) — nenhuma chamada HTTP a serviço de embedding externo. Vetor resultante fica local, idempotente por documento. Invocação via `ComputePort` (§4) com site fixado a `local`, classe de privacidade "restrita" — dados do usuário não deixam o dispositivo.
5. Qualquer invocação de **capacidade de IA remota que necessite contexto** obtém-no via esta capacidade: o payload comprimido + embedding viajam para o site `external` em vez do arquivo bruto. O chamador (agente via invocação síncrona ou assíncrona — §5) recebe uma resposta normalizada pelo `ComputePort` sem conhecer o backend.

### Archetype: fs-plugin

1. **fs-plugin** é um archetype de plugin `node`, categoria `compute` — a capacidade **mais perigosa** do sistema de plugins: expõe acesso a `fs/promises` e `child_process` do Node.js, ambos restritos por sandbox e porta explícita concedida pelo ASSET:ROLE da persona executora (§6, item 1).
2. **Sandbox de diretório:** o plugin roda em isolate com capacidades escopadas por `ASSET:ROLE`; acesso a grafo, rede e FS só pelas portas concedidas (§6.1). Escopo restrito à worktree da task (raiz do repositório da invocação) — jamais ao sistema operacional host; invocações que tentam subir além da raiz são rejeitadas como violação de privilégio.
3. **Contrato tipado:** expõe funções estruturadas (`read_file`, `write_file`, `list_dir`, `run_command`) por `ComputePort` com schema de entrada/saída; nenhum acesso direto a `fs` ou `child_process` sem mediação (§6, item 2 — "entrada e saída só pelo contrato"). Determinismo não é garantido (comandos externos podem falhar ou divergir); porém assinatura do executor e reputação governam confiança (§5.4).
4. **Classe de privacidade restrita por padrão:** dados manipulados via fs-plugin pertencem ao workspace local e consideram-se restritos — cruzar para site `peer` fora do círculo de confiança ou `external` sem consentimento explícito viola [[classe-de-privacidade]] (§6.3). Mecanismo de gate: a SPEC da invocação pode fixar `site: local` na declaração de capacidade.

### Archetype: provider-plugin

1. **provider-plugin** é um archetype que padroniza entrada/saída (streaming) de chamadas a modelos de IA, permitindo roteamento dinâmico de uma tarefa para o provedor ou modelo mais adequado sob a mesma interface de capacidade `compute` (`ComputePort`, §4). Abstrai diferenças entre provedores via contrato tipado de capacidade — sem citar fornecedores específicos como parte normativa.
2. **Quando o provider é remoto** (API externa de terceiro), a invocação é uma instância da categoria `connector` (§3) — consome `NetworkAdapterPort` no site `external`, conforme a tabela de categorias em §3. Não é uma quinta categoria de capacidade; é `connector` acessado via `ComputePort` pelo roteador de capacidades.
3. **Quando o provider roda on-device** (ex.: Ollama local, llama.cpp embarcado), a invocação é `compute` puro no site `local`, usando a mesma interface de capacidade `compute`. Escalonador elegibilidade por runtime: runtimes da tarefa ⊆ runtimes do site (§4.3).
4. **Streaming normalizado:** entrada e saída normalizam-se como Server-Sent Events ou estrutura de iterador agnóstica de linguagem (sem depender de bibliotecas de terceiros como detalhe normativo), permitindo que o chamador (agente) receba respostas incrementais sem conhecer o backend real. Determinismo não é garantido (IA é não-determinística por natureza); reputação e assinatura do executor governam confiança (§5.4).

### Archetype: research-plugin

1. **research-plugin** é um archetype de plugin `node`, categoria `connector`: expõe acesso a serviços externos (redes sociais, fóruns, repositórios de código, news aggregators) via wrappers CLI locais autenticados pelos cookies de sessão do navegador do peer/usuário, contornando APIs pagas ou bloqueadas.
2. **Autenticação por cookies locais:** a execução usa cookies já presentes no navegador local do usuário/peer para autenticar em serviços externos. Nenhuma credencial hardcoded; nenhuma API externa paga consumida. O agente invoca binários CLI através do **fs-plugin** (Archetype acima, item 3) que acessa `child_process` sandboxado.
3. **Classe de privacidade restrita (dado sensível):** cookies de sessão são credencial privada do usuário e consideram-se restritos conforme [[classe-de-privacidade]] (§6.3). Execução deve ficar **fixada a site `local`** — nunca cruzar a fronteira E2E para `peer` fora do círculo de confiança ou `external` sem consentimento explícito. Mecanismo de gate: `site: local` obrigatório na SPEC da capacidade, conforme item 3 de §6.
4. **Semântica de connector:** consome `NetworkAdapterPort` no site `external` apenas para os serviços destino que o CLI precisa alcançar — o próprio invocador reside em site `local`. Integração com o **fs-plugin** permite que o agente encadeie leitura de repositórios e processamento de metadados sem sair do device.

---

## §4 — ComputePort, Sites de Execução e Casamento por Capacidade de Runtime

1. Capacidade `compute` é invocada por `id` através da **`ComputePort`**, que resolve **site** e **modo** sem o chamador conhecer o backend (IoC, como o roteamento de conectores).
2. **Três sites:**
   - `local` — no dispositivo (browser plugin na aba/Worker; node plugin no Electron). Default local-first.
   - `peer` — peer remoto da malha que **anuncia** a capacidade via aresta [[serves-aresta]] e cujo perfil de runtime/recurso satisfaz o plugin (computação síncrona "em outro peer").
   - `external` — endpoint não-peer alcançado por **ququer NetworkAdapter** declarado (não só REST: WS, datachannel, custom) — é o território dos conectores RFC-007.
3. **Legalidade por casamento de runtime:** cada peer anuncia seus runtimes (`browser`, `node`) e perfil de recurso. O escalonador só elege um site onde `plugin.runtime ⊆ site.runtimes` **e** o recurso cabe. Peer cloud headless oferece só `node`; Electron oferece ambos; peer web puro só `browser`. Não há combinação ilegal possível — a indisponibilidade de runtime simplesmente remove o site do conjunto elegível.
4. **A SPEC do fluxo chamador pode fixar restrições** (site permitido, modo, classe de privacidade máxima). Sem site elegível e sem fallback → `fato-negativo-verificável`, nunca execução em site proibido.

---

## §5 — Dois Modos: Síncrono e Fila Assíncrona

1. **Síncrono:** request/response sobre o transporte do site (`local` in-process; `peer`/`external` sobre o adapter). Chamador aguarda dentro de um orçamento de tempo; estouro → aborto + fato negativo.
2. **Assíncrono (fila):** a invocação materializa uma **task = nó** governada por SPEC. Um worker elegível **reivindica via [[asset-lock]]**; a [[serialization-por-linhagem]] garante que dois workers não peguem a mesma task (de graça, mesmo mecanismo anti-oversell). O resultado é publicado como nó **assinado pela persona do executor** ([[agente-de-sistema]] quando system-peer), **idempotente** por chave de requisição (reentrega → no-op). O claim por [[asset-lock]] carrega **lease com heartbeat**: o worker renova o lock dentro de um intervalo curto governado por SPEC; expirado o lease sem renovação (ex.: aba do Browser Worker fechada), o lock é considerado solto e a task volta à fila para re-claim, sem intervenção. A idempotência por chave de requisição garante que re-claim após conclusão tardia seja no-op. O nó de resultado liga-se ao executor por aresta **`PERFORMED_BY`** (resultado → persona do worker assinante), tornando a procedência da computação consultável e insumo direto do registro auditável de A.7. O bundle binário é cacheável e expurgável localmente, mas o `SPEC:PLUGIN` que o produziu permanece imutavelmente referenciado por toda task que o invocou ([[linhagem-de-versoes]]): a procedência ('gerado pelo plugin X-vN') é auditável mesmo após o bundle sair dos caches.
3. **Unificação:** geração de renditions (transcode), [[consolidacao-de-live]] (gravação consolidada pelo system-peer) e embeddings (RFC-011) deixam de ser mecanismos avulsos e passam a ser **instâncias do modo assíncrono** deste protocolo.
4. **Determinismo declarado governa a verificação:** capacidade determinística admite verificação por re-execução amostral (resultado divergente entre executores = alerta); capacidade não-determinística (IA) opera no regime de confiança por assinatura do executor + reputação.
5. **Retomada do chamador não é orquestração nova.** Quando o chamador de uma invocação assíncrona é um [[agente-de-ia]], a conclusão da task (nó de resultado publicado, aresta `PERFORMED_BY`) dispara a retomada do agente por **sinal efêmero** ou **intent durável** endereçado (`caderno-4-governance/02b-modulos-profiles-mensageria.md §2` — `sendSignal`/`sendIntent`), reaproveitando a mesma mensageria de módulo já normativa. Não existe um "orquestrador" ou "scheduler" central separado deste protocolo — a fila deste §5 **é** o mecanismo de despacho e retomada.

---

## §6 — Sandbox, Capacidades e Classe de Privacidade

1. **Sem autoridade ambiente.** Browser plugin roda em Worker/WASM isolado: sem DOM (exceto via bridge de componente declarado — RFC-008 A.4), sem rede (exceto portas declaradas), sem storage direto. Node plugin roda em processo/isolate com capacidades escopadas por `ASSET:ROLE` da sua persona; acesso a grafo, rede e FS só pelas portas concedidas.
2. **Entrada e saída só pelo contrato:** o plugin recebe exatamente o schema de entrada declarado e devolve o de saída; não enxerga o grafo além do que a capacidade pede.
3. **Classe de privacidade × site:** o contrato declara se a capacidade vê plaintext sensível; cruzar a fronteira E2E (site `external`, ou `peer` fora do círculo de confiança) com dado de classe restrita é **proibido por construção** e exige consentimento explícito quando permitido. Exemplo normativo: cálculo de folha (rfc-014) jamais elegível a site `external`; transcode de vídeo público elegível a qualquer site.
4. **Invocação por agente intersecta escopos.** Quando o chamador é um [[agente-de-ia]], o `ASSET:ROLE` do plugin não é a autoridade final: o efetivo é a **interseção** com o `ASSET:ROLE` já delegado ao agente pelo seu principal (`caderno-3-sdk/14-ia-rag-e-agentes.md §5`) — um plugin nunca é o caminho para um agente exceder o que seu principal já autorizou.

---

## §7 — Economia da Computação (Governada por SPEC)

1. A remuneração por computação servida (`peer`) e por oferta/uso de plugin é **evento econômico governado por SPEC**, não regra fixa do protocolo. A plataforma prevê uma **economia de tokens**, mas *se* há cobrança, *como* se precifica/negocia, e a existência de um **"imposto" de manutenção da rede** são decididos pela SPEC econômica de cada implementação ([[economia-como-modulo]], [[modalidade-de-rede]]).
2. Implementações P2P puras podem operar a custo zero/cortesia; redes públicas/corporativas podem precificar via Zen Engine (por chamada, por recurso, por tempo) e reter imposto de rede. O protocolo apenas garante o **registro auditável** do trabalho servido (quem executou o quê, quando) como insumo de qualquer SPEC econômica.
