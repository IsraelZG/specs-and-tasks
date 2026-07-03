# ADR-004 — Distribuição Unificada de Plugins Nativos via Media Plane + Renditions

- **Data:** 2026-07-02
- **Status:** Accepted
- **Autor:** Claude (sessão forte, spike T-1040)
- **Decisores:** arquiteto da plataforma

---

## Contexto

O contrato de distribuição de plugins (`caderno-3-sdk/12-plugins-e-computacao.md §1-§2`) promete: bundle assinado e versionado por um `SPEC:PLUGIN`, transportado como blob pelo media plane, **única via de obtenção é o marketplace, sem sideload**. Mas o mesmo caderno (§3) já lista, na categoria `infra`, software que **não é TypeScript/WASM** — o exemplo dado é o SFU LiveKit (Go). O usuário quer estender isso deliberadamente a mais binários nativos existentes (llama.cpp, C++, sendo o caso âncora), sem abrir uma segunda via de distribuição "para os nativos" — a exigência explícita é **um único modelo**, sempre usando a infra que já existe.

Este ADR resolve a subtask **AB-09** da absorção do RFC `plugin_architecture_blueprint` (`docs/rfcs/_absorcao-plugin_architecture_blueprint.md`) e é o entregável do spike [T-1040](../../tasks/T-1040.md).

---

## Descoberta central

O **media plane** (`caderno-3-sdk/05-media-transport-plane.md`) já é **agnóstico ao conteúdo dos bytes**: chunking em potências de 2 (default 1 MiB), cifra AES-256-GCM por chunk, content-addressing (`InfoHash`/`CID`) sobre o ciphertext, adapters plugáveis (WebTorrent/IPFS/Cloud-WebSeed). Nada nesse plano assume que o payload é "mídia" no sentido estrito — ele **já** é usado para distribuir bundles de plugin JS/WASM (`caderno-3-sdk/12 §1`: *"O bundle binário... é transportado como blob pelo media plane"*). Um binário nativo (o executável do LiveKit SFU, ou llama.cpp compilado) é, para o media plane, apenas mais uma sequência de bytes. **Não há necessidade de um segundo mecanismo de transporte.**

A segunda descoberta resolve diretamente a primeira pergunta em aberto do spike (*"N bundles, um por OS/arch, sob o mesmo `SPEC:PLUGIN` — como?"*): a plataforma **já tem exatamente essa abstração** — [[rendition]]. Uma rendition é *"uma variante de um asset... (qualidade, idioma, bitrate, codec)... nó `CONTENT` próprio, content-addressed e imutável... ligado ao asset lógico por `RELATES:MEDIA:RENDITION`... renditions são irmãs, não versões"*. Um binário `linux-x64` e um binário `macos-arm64` do mesmo plugin são estruturalmente idênticos a um vídeo 1080p e um 4K do mesmo filme: mesmo asset lógico, discriminador diferente, bytes diferentes, cliente escolhe pela sua própria capacidade.

---

## Decisão

### 1. Binário nativo = rendition do `SPEC:PLUGIN`, discriminada por plataforma

Reaproveita-se o schema de rendition (`caderno-3-sdk/05 §4.3`) sem alteração de forma, generalizando o discriminador:

```json
{
  "asset_id": "spec_plugin_livekit_sfu",
  "rendition": { "kind": "native_binary", "os": "linux", "arch": "x64", "abi": null },
  "encryption": { "...": "idêntico ao schema de mídia — AES-256-GCM por chunk, tag_region, key_ref via UCAN/Key Vault" },
  "pointers": [
    { "adapter": "cloud_webseed", "url": "https://webseed.suarede.com/blobs/" },
    { "adapter": "webtorrent", "infohash": "hash_do_ciphertext" }
  ],
  "provenance": {
    "kind": "attested_upstream",
    "upstream_release": "livekit-server v1.8.2",
    "upstream_checksum": "sha256:...",
    "attested_by": "<peer/profile que curou a listagem>"
  }
}
```

O `kind: "native_binary"` (em vez de `video`/`audio`/`caption`) é o único acréscimo de vocabulário — a mecânica de asset lógico → renditions irmãs, `MUTATES` reservado só para "recompilar a mesma versão", `SERVES` para fontes, tudo se aplica sem mudança. O `SPEC:PLUGIN` continua sendo o nó que assina/versiona **o conjunto** de renditions (um por par OS/arch); o runtime, no load, filtra pelo próprio par OS/arch — o mesmo mecanismo de "cliente escolhe a rendition pela capacidade" que já rege mídia (`caderno-3-sdk/05 §5`), generalizado de "banda disponível" para "plataforma de execução".

O campo `provenance` é novo (não existe em rendition de mídia) — ver item 2.

### 2. Dois níveis de confiança, explícitos — não escondidos atrás de "assinado e listado"

O texto atual (§2) diz *"o runtime só carrega bundles cuja procedência é um `SPEC:PLUGIN` válido, assinado e listado"* — verdadeiro para os dois casos, mas **o que "procedência" significa muda**:

| | Bundle JS/WASM (first-party ou terceiro com fonte) | Binário nativo de terceiro (LiveKit, llama.cpp) |
|---|---|---|
| O que é verificado | Assinatura Ed25519 do autor **+** (opcionalmente) revisão de código-fonte/análise estática, conforme critério da implementação (§2.2) | Assinatura Ed25519 do **curador que listou**, atestando que o hash corresponde a um release oficial publicado por X |
| O que a assinatura garante | "Este código foi revisado/é auditável" | "Este binário **é** o que o upstream publicou sob esse nome/versão" — procedência, não conteúdo |
| Precedente já existente fora da plataforma | — | Gerenciadores de pacote de SO (apt/homebrew) já operam majoritariamente neste segundo regime: a maioria dos pacotes não é auditada linha a linha pela distro, é checksum-pinned contra o upstream |

Isso não é uma via de confiança mais fraca "escondida" — é uma categoria **declarada** no manifesto (`provenance.kind: "audited_source" | "attested_upstream"`), visível na listagem do marketplace, para que a implementação decida seu próprio apetite de risco (`caderno-3-sdk/12 §2.2` já estabelece que "critérios dependem da implementação"). Rede P2P pura pode aceitar `attested_upstream` livremente; rede corporativa pode exigir dupla assinatura (curador + operador) para essa categoria.

### 3. Sandbox: Espectro de Defense-in-Depth para Plugins Nativos

Sandbox de plugin nativo é um ESPECTRO de defense-in-depth, não um sim/não. "Procedência + consentimento do operador" é o PISO (fallback quando sandbox de SO não está disponível), não o teto. Mecanismos, do mais alinhado à plataforma ao mais forte:
(a) BROKER/PROXY (preferencial, e cumpre honestamente o §6 "sem autoridade ambiente"): o binário não recebe FS/rede crus. FS via FUSE/vfs controlado pelo plugin-runtime — só os paths declarados no manifesto são visíveis (fronteira física, não JSON confiado). Rede via proxy local; o próprio NetworkAdapterPort da plataforma É o proxy — o plugin fala com endpoint local e o transporte decide o egress. Toda operação passa por um handle de broker (IPC) checado contra as capabilities UCAN do plugin.
(b) SANDBOX DE SO: seccomp-bpf + namespaces + cgroups + Landlock (Linux, via bubblewrap); sandbox-exec/Seatbelt (macOS); AppContainer + Job Objects (Windows).
(c) TIER PARANOICO: gVisor (kernel user-space) ou microVM (Firecracker) — isolamento de hardware-virt, custo de perf.

Taxonomia por categoria:
- Plugins cuja rede PODE ser brokered (connector, research, maioria dos compute) → proxy obrigatório, escopo de rede aplicado pelo runtime.
- Plugins que PRECISAM de canal cru por design (infra: SFU LiveKit, WebTorrent — ver §3.2 do caderno-3/12) → ainda recebem egress-filtering (só hosts declarados) + cgroups + FS restrito; a autoridade crua existe só DENTRO do escopo de rede permitido.

O manifesto do SPEC:PLUGIN declara um TIER MÍNIMO de sandbox por capacidade; a UI de instalação mostra o tier ("processo nativo isolado por broker, acesso a: <paths/hosts>" vs "processo nativo com canal de rede próprio, verificado por: <curador>"). Limite honesto residual: nenhum sandbox é perfeito contra exploit de kernel (daí o tier microVM); e a implementação é específica por SO.


### 4. Peso/tamanho — sem mudança necessária no media plane

O modelo de chunking (1 MiB, potência de 2) e os adapters (WebTorrent/IPFS/WebSeed) já são desenhados para arquivos grandes (vídeo) — nada em `caderno-3-sdk/05` assume payload pequeno. Pesos de LLM (GBs) cabem no mesmo mecanismo sem alteração de schema. Único ajuste operacional (não arquitetural): `caderno-3-sdk/05 §9` ("Limites Honestos") deveria ganhar uma nota — blobs multi-GB devem preferir Cloud WebSeed como fonte primária sobre swarm P2P puro; mobile efêmero já é excluído de custódia crítica por tier (§7), o que já mitiga o pior caso.

### 5. AB-09 resolvida por decorrência

Onde o código first-party vive no monorepo: como plugins (JS/WASM **ou** nativos) são sempre distribuídos como blob assinado via marketplace — nunca como pacote do monorepo importado diretamente em runtime — o monorepo só precisa hospedar (a) o **runtime/loader/sandbox** (`ComputePort`, verificação de assinatura, resolução de rendition por OS/arch) como pacote normal, e (b) opcionalmente o **código-fonte dos plugins first-party** como pacotes de build (que produzem os bundles/binários publicados como blob, não consumidos como dependência direta). Nome sugerido para o runtime: `packages/plugin-runtime/`. Os plugins first-party (`fs-plugin`, `provider-plugin`, `context-plugin`, `research-plugin`) podem viver em `packages/plugins/<nome>/` como fonte de build, mas em runtime são carregados como qualquer plugin de terceiro — **dogfooding da regra "sem sideload"**, sem exceção para código da própria plataforma.

---

## Consequências

### Positivas
- Nenhum mecanismo de transporte novo — reuso total do media plane e do modelo de rendition já especificados.
- Confiança em binário de terceiro fica **declarada** (`provenance.kind`), não implícita — mais honesto que fingir uma garantia de auditoria que não existe para binário opaco.
- AB-09 (localização no monorepo) resolvida sem decisão paralela.

### Negativas / Trade-offs
- Sandbox de `infra` nativo é mais fraco que o de `browser`/`node` JS — precisa ser comunicado com clareza na UI de instalação (trabalho de produto, fora deste ADR).
- `provenance.kind: "attested_upstream"` introduz responsabilidade de curadoria (quem atesta o hash é responsável por mantê-lo atualizado a cada release upstream) — não é automatizável sem um processo humano ou CI de acompanhamento de upstream.
- Sandboxing real de SO para `compute` nativo (item 3) é trabalho de implementação não-trivial, ainda não especificado — abre um épico próprio, não fechado aqui.

---

## Alternativas Rejeitadas

| Alternativa | Razão da rejeição |
|---|---|
| Segunda via de distribuição só para binários nativos (ex.: registro de containers separado) | Contradiz o objetivo explícito de "uma única via" — duplica a lógica de assinatura/listagem/confiança em dois lugares |
| Tratar binário nativo como `CONTENT:FILE` genérico solto, em vez de rendition de um `SPEC:PLUGIN` | Perde a linhagem/assinatura/versionamento que `SPEC:PLUGIN` já dá de graça; um binário nativo **é** um plugin, não um anexo solto |
| Fingir que sandbox de processo nativo é equivalente ao de JS/WASM | Falso por construção — melhor documentar o limite honesto (item 3) do que produzir uma garantia de segurança que não se sustenta sob adversário real |

---

## Abertos (não bloqueiam o modelo central, mas precisam de dono)

1. **Mecanismo concreto de sandboxing de SO** para `compute` nativo (item 3) — épico de implementação separado, fora do escopo deste ADR.
2. **Processo de curadoria/atualização de `provenance.kind: attested_upstream`** — quem é responsável por re-atestar quando o LiveKit lança v1.8.3? Política de marketplace, não arquitetura de protocolo.
3. Este ADR foi **Accepted** e ratificado pelo arquiteto, marcando AB-09 `[x]` no manifesto de absorção da RFC e liberando a deleção do draft `rfc- plugin_architecture_blueprint - draft.md`.

---

## Referências
- `docs/caderno-3-sdk/12-plugins-e-computacao.md §1-§3, §6` — contrato de plugin
- `docs/caderno-3-sdk/05-media-transport-plane.md` — media plane, chunking, adapters
- `docs/conceitos/rendition.md` — mecanismo de variantes reaproveitado
- `docs/conceitos/livekit.md` — caso concreto já existente de plugin `infra` não-JS
- `docs/rfcs/_absorcao-plugin_architecture_blueprint.md` — AB-09, origem deste spike
- `tasks/T-1040.md` — spec do spike
