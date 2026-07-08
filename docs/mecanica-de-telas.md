# Mecânica de Telas — interação por módulo (complemento do inventário)

> **O que é este doc.** O [inventário de telas](inventario-de-telas.md) define a **composição**
> (quais telas/modais/estados existem); os reference specs do `caderno-3-sdk/` definem a **mecânica
> de dados/protocolo** (SPECs, arestas, sagas). Faltava a camada do meio: a **mecânica de
> interação de cada tela** — máquinas de estado de UI, gatilhos, transições e feedbacks. Este doc a
> documenta, consolidando o que foi **validado nos mockups Lovable** (handoff
> `handoff-wiring-mockups-specs-mgtia.md`, 17 blocos verificados ao vivo + auditados por código em
> 2026-07-07) e detalhando o que o mockup não cobriu (marcado como **[proposta]** — vira decisão de
> spec ao endurecer a task correspondente).
>
> **Regras de uso:**
> - O mockup Lovable (TanStack + TinyBase) é **descartável** — a mecânica descrita aqui é a decisão
>   validada, nunca o código. NÃO portar TSX; NÃO copiar nomes de campo TinyBase para contratos.
> - Paleta de cores é placeholder (T-DS-05 decide a definitiva). Tokens sempre `--ds-*`.
> - Invariantes transversais (i18n 6 locales + RTL, a11y AA, responsivo) valem em toda tela e
>   **não foram validados pelo mockup** (copy 100% pt-BR) — ver `diretrizes-ux.md` §7–8.
> - Tasks apontam para cá pela âncora do módulo (ex.: `mecanica-de-telas.md §A1`).

## Pacotes prontos — mapa de reuso

| Pacote | Onde reusar | Status |
|---|---|---|
| `@plataforma/design-system` | **45 componentes prontos** (Command, Modal, AlertDialog, Sheet, Skeleton, Toast, Table, Tabs, Resizable, Sidebar, NavItem/NavGroup, Avatar, Badge, Progress, Calendar, Carousel, Combobox, FormField, InputOTP, Message…) + tokens light/dark via Style Dictionary. O catálogo C do mockup mapeia ≈1:1 — **mapear, não portar** | pronto no monorepo |
| `flexlayout-react` | Shell A1 (decisão caderno-28; mockup validou `model.toJson()`/`fromJson()`, rails fixos com min/maxWidth, `addNode`/`deleteTab`) | OSS, já decidido |
| LiveKit (`livekit-client` + SFU plugin) | B1 chamadas (T-MSG-02), B8 live (T-STR-03); distribuição do plugin nativo → spike T-1040 | OSS, já decidido |
| Automerge | B12 doc editor (T-OFF-02), sessões efêmeras (T-MOD-03) | OSS, já decidido |
| `rrule` (rrule.js) | B11 expansão de recorrência — o mockup usou parser mínimo (FREQ/BYDAY) escrito à mão; produção usa rrule.js **mantendo a mesma mecânica** (janela + exceções, §B11) | OSS, candidato forte |
| `@scure/bip39` | A2 geração/validação de seed (T-104 `done` já cobre a cripto) | já no core |
| `maplibre-gl` | B5 tiles reais (mockup usou SVG placeholder de propósito); dados via conector Classe E (T-MAP-02) | OSS, candidato |
| `hls.js` | B8 reprodução adaptativa sobre o media plane (`caderno-3-sdk/05`) | OSS, candidato |
| `@plataforma/media` | blobs/mídia (posts, anexos, renditions) | parcial no monorepo |
| TinyBase | **NÃO usar** — era só a store do mockup | descartável |
| Planilha (T-OFF-03) | spec exige **motor first-party** (fórmulas + ZEN) — não adotar HyperFormula/etc. sem decisão de arquiteto | decisão pendente |

---

## T. Padrões transversais (além do mockup — melhores práticas de indústria)

> Esta seção fixa padrões que os grandes players fazem certo e que valem como **requisito default
> em todo módulo**. Nada aqui foi validado no mockup Lovable — são decisões de design informadas
> por indústria (Notion, Figma, Gmail, Slack, macOS), a validar por task. Marcadas [proposta].

### T1. IA assistente contextual em todo módulo [proposta]

Todo módulo tem assistente — o substrato é T-IA-04 (persona delegada) + T-IA-05 (palette).
Padrão consolidado (Notion AI / Copilot / Gemini-in-Workspace):

- **Três portas de entrada consistentes em todo módulo:** (1) command palette global
  (⌘K → modo Gerar, §A5); (2) ação "✦ Assistente" na toolbar da superfície, já com o contexto do
  que está na tela; (3) **seleção de conteúdo → menu flutuante** com ações de IA (reescrever,
  resumir, traduzir, transformar).
- **Proposta-first, sempre:** a IA nunca aplica direto — preview com **Aceitar / Editar /
  Descartar** (§A5); aceitar emite intent normal com **atribuição de delegado** (diretrizes-ux §3).
  Tudo que a IA aplicou é desfazível como qualquer edição.
- **Escopo visível e revogável:** o assistente opera sob `ASSET:ROLE` delegado; a UI mostra
  persona + escopo ao lado da proposta; revogação em Configurações › Permissões (§A3).
- **Streaming cancelável:** progresso real token-a-token + botão Parar; recusa fora de escopo é
  estado desenhado (§A5), nunca erro técnico.
- **Ações canônicas por módulo (v1):** Social → rascunho de post/legenda a partir de tema ou
  mídia · Marketplace → descrição/atributos de listing a partir de foto, sugestão de preço ·
  ERP → preencher ordem a partir de texto livre ("3 caixas do SKU X pra Cliente Y") · Contábil →
  explicar lançamento derivado, sugerir conciliação · Email → rascunho/resposta no tom da thread,
  resumo de thread longa · Calendário → agendamento por linguagem natural ("reunião com Ana quinta
  15h") · Mapa → busca por linguagem natural · Streaming/Studio → título/descrição/capítulos,
  edição de mídia assistida (T-OFF-05) · Ads → gerar criativo a partir do item promovido, sugerir
  orçamento/segmentação · Logística → otimizar sequência de entregas (proposta com diff da rota).

### T2. Integração entre módulos — drag-and-drop e dados que viram ações [proposta]

Substrato já contratado: `InterPanelMessage` + `AcceptContract` (T-SHL-04) — **drag no desktop e
share no mobile são a mesma mensagem de comando**. Mecânica de interação (padrão macOS/Figma):

1. Iniciar drag → **ghost** com preview do payload; colunas/módulos cujo `AcceptContract` aceita o
   `payloadType` **se iluminam** como drop targets; os demais esmaecem. Soltar em alvo inválido =
   animação de retorno, sem modal de erro.
2. Soltar com **uma ação possível** → executa direto com toast + **Desfazer**. Com **múltiplas
   ações** → menu contextual no ponto do drop (ex.: produto no chat: "Enviar card" | "Criar
   oferta"). Ação irreversível → confirmação + time-delay (contrato T-SHL-04).
3. Toda ação vira **intent normal** (auditável, com autor); o payload carrega **referência ao nó
   do grafo, nunca cópia** — normativo no caderno-28 §6.4.

**Matriz payload → ação (v1):** canonicalizada em
[`caderno-3-sdk/28-shell-e-composicao.md §6.1`](caderno-3-sdk/28-shell-e-composicao.md) — os
`AcceptContract` dos módulos (T-SHL-04) devem cobri-la; não duplicar aqui.

### T3. Boas práticas default dos grandes players [proposta]

- **Undo em vez de confirmação** para tudo que é reversível (padrão Gmail): toast com "Desfazer"
  (janela 5–10s) em enviar/arquivar/mover/aplicar-IA; modal de confirmação SÓ para
  destrutivo/irreversível. Menos fricção e mais segurança real.
- **Autosave universal + indicador discreto** ("Salvo · agora") onde há edição (Studio, campanhas,
  configurações); botão Salvar bloqueante só em formulário transacional (checkout, fechar
  competência).
- **Teclado-first:** ⌘K universal; overlay de atalhos por módulo (tecla `?`); setas navegam
  listas; Esc consistente (fecha o overlay mais recente).
- **Listas grandes = virtualização + cursor** (feed, inbox, lançamentos, catálogo) — nunca
  carregar tudo; skeleton na primeira página, item-a-item nas seguintes.
- **Notificação é acionável:** clicar leva à superfície exata via deep-link (T-SHL-04) com o item
  destacado; agrupamento por origem (padrão GitHub/Slack); digest configurável.
- **Nada de modal sobre modal;** fluxo com >2 passos vira wizard ou página.
- **Busca com zero-state útil** (recentes + sugestões) em vez de campo vazio (padrão Spotlight).

---

## A1. Shell & Composição — T-SHL-01..05

Fontes: `caderno-3-sdk/28-shell-e-composicao.md` · inventário §A1 · mockup A1 (`1eb1e56`).

**Layout default (validado; canonicalizar no caderno-28 §4.1):** rail esquerdo = comunicações
(largura fixa ~68px, sem tabstrip, sem drag/drop) · coluna de mensageria · coluna central = app
ativo · rail direito = launcher de módulos. Header (busca ⌘K, tema, configurações) e footer de
status (dot sync: verde=sincronizado / âmbar=sincronizando / vermelho=offline + online/sem rede +
app ativo).

**Mecânica de colunas (validada):**
1. Ação do usuário abre app/página em **nova coluna** à direita da central (`addNode` RIGHT).
2. **Guarda de espaço:** se `window.innerWidth < 1280` OU já há 3 colunas abertas, a coluna
   **menos recente** é colapsada para a **pilha de colapsados** (chip com nome; clicar restaura
   como nova coluna). Restaurar = remontagem (estado efêmero zera — comportamento esperado, §11.3).
3. **Split em rows é exceção** — só por ação explícita do app da coluna (ex. "detalhe").
4. **Editores que pedem mais área** (email, doc, foto) abrem em coluna mais larga (weight maior)
   — ou em overlay fullscreen (exceção Studio/Email, ver §B10/§B12).
5. Layout persiste a cada mudança (`model.toJson()` → store); restaurar workspace = `fromJson()`.

**Workspace switcher [proposta — mockup NÃO cobriu; contrato já fixado em T-SHL-01 §1]:**
dropdown no header listando `WorkspaceStore.list()`; "Salvar arranjo atual como…" (nome) →
`persistWorkspace(name)`; selecionar → `restoreWorkspace(name)` com confirmação se houver painéis
efêmeros; excluir com AlertDialog. Default sempre existe e não é excluível.

**Mobile (T-SHL-03, validado):** coluna única = app central; rails viram overlays fullscreen
disparados por botões no footer (Comms/Apps); fechar volta ao app. Chrome reposiciona, não some.

**Não cobrido pelo mockup (detalhar ao endurecer T-SHL-04/05):** deep-link/rota de painel,
drag-and-drop de item entre painéis como **mensagem de comando com contrato de aceite** (não DnD
visual apenas), share sheet, estados painel-em-erro/skeleton por painel, suspensão de painel.

**Pacotes:** `flexlayout-react`; `@plataforma/design-system` (NavItem/NavGroup, Sheet, Toast).

## A2. Identidade & Onboarding — T-104/208/209/210/512/705 (backend done/ready)

Fontes: inventário §A2 · mockup A2 (`d309813`) · conceitos [[asset-invite]], [[delegacao-de-dispositivo]].

**Boas-vindas (validado):** 3 entradas — Criar nova rede (primária) · Entrar com convite · Entrar
com identidade. Rodapé fixo: "Suas chaves nunca saem do dispositivo" + link "Como funciona?".

**Criação de identidade (validado):** passo 1/2 — toggle 12/24 palavras (radiogroup); "Gerar" →
skeleton grid + "Gerando…" (aria-live) → grid numerado de palavras + "Gerar outra"; aviso
`role="alert"` danger: "Anote em papel. Perder esta frase = perder o acesso para sempre".
Passo 2/2 — **confirmação ativa**: redigitar as palavras de 3 posições fixas (2ª/5ª/9ª);
case-insensitive; erro genérico "Palavras incorretas" limpa ao digitar. Nunca checkbox passivo.

**Desbloqueio (validado):** senha com toggle mostrar/ocultar, Enter submete, erro inline;
biometria desabilitada com tooltip "disponível no dispositivo real"; "Esqueci minha senha" expande
explicação local-first (sem servidor que restaure — use a seed). **Erro de senha não pode vazar
timing** (requisito de produção, não exercitável em mock).

**Cerimônia de convite [proposta — mockup NÃO cobriu; backend T-210 done]:** colar link/código →
validação do `ASSET:INVITE` (estados: válido / expirado / já usado — mensagens distintas, sem
retry infinito) → cria `PROFILE:AUTHENTICATION` → cai no desbloqueio. Offline = enfileira
validação com estado "aguardando rede".

**Pareamento QR+SAS [proposta — mockup NÃO cobriu; cripto T-705 ready]:** dispositivo novo exibe
QR; dispositivo pareado escaneia; ambos exibem o **mesmo código SAS** (emoji/dígitos) e cada lado
confirma "os códigos batem" antes de a delegação valer. Cancelar em qualquer lado aborta os dois.

## A3. Permissões, Consentimento & Segurança — T-503/506 (draft) · T-501/504 (done/ready)

Fontes: inventário §A3 · mockup A3 (`893694a`) · [[asset-consent]] · `diretrizes-ux.md` §4.

**Prompt de consentimento (validado):** Dialog com: quem pede (nome+ícone) · capacidade (o quê) ·
escopo (sobre o quê) · duração (TTL) · lembrete "revogável em Configurações › Permissões".
**Conceder e Negar com peso visual idêntico** (mesma variante de botão) — anti dark pattern.
Fechar sem escolher = não registra nada. Toda resposta é registrada (granted/denied + timestamp).

**Gerenciador de permissões (validado):** tabela Quem (pessoa|app) / Capacidade / Escopo /
Validade / Revogar. Revogar → AlertDialog com **aviso de revogação por cortesia**: "peers que já
sincronizaram podem reter até a próxima sync — não há apagamento imediato garantido na rede".

**Bloqueios (validado):** bloquear perfil → conteúdo some do feed ("não foi apagado, só filtrado
para você"); desbloquear reverte. Placeholder de conteúdo bloqueado é limite honesto, não erro.

**Estados de acesso (validado, com ressalva de copy):** acesso negado genérico; rotação de época
("Sincronizando chaves de acesso… tente em instantes"). **⚠ Decisão de copy pendente:** o mockup
diz "Você não tem permissão para ver este conteúdo", o que vaza a existência do dado; a diretriz
§4 + handoff pedem mensagem que não distinga "não existe" de "sem permissão" (ex.: "Este conteúdo
não está disponível"). Registrar ao endurecer T-503/T-506.

## A4. Sistema / Conta / Configurações — T-901/903 · T-DS-03/05

Fontes: inventário §A4 · mockup A4 (`1b2a730`) · `caderno-3-sdk/09` (tema hierárquico).

**Validado:** tabs Geral/Tema/Rede/Telemetria/Notificações/Permissões(link). Geral: nome, 6
locales (RTL só declarado — produção precisa exercitar), tema claro/escuro (radiogroup), densidade
cozy/compact (afeta paddings via estado global), alto contraste e reduzir movimento (switches).
Dispositivos pareados com "Revogar sessão" (AlertDialog implícito). **ThemeEditor:** hierarquia
4 níveis (app→módulo→página→componente) em accordion; editar tokens (cores + raio) reflete em
**preview isolado** — nunca aplica direto; "Salvar como tema customizado" persiste. Rede: badges
online/sync + lista de peers com status/último visto. Telemetria: métricas RTT/bytes-por-onda/WAL
+ gráfico de barras + exportar. Notificações: lista com dot não-lido; clicar marca lido.

**Não cobrido:** menu de conta/avatar no header; agrupamento de notificações.

## A5. IA & Agentes — T-IA-04/05 (draft)

Fontes: inventário §A5 · mockup A5 (`bb066d7`) · `caderno-3-sdk/14`.

**Command palette (validado):** overlay ⌘K/Ctrl-K; 3 modos em tabs — **Buscar** (resultados
progressivos: skeleton ~220ms debounce → lista com tipo+snippet; **só itens `allowed`** — filtro
de permissão acontece antes do render, nunca "mostra e esconde") · **Agir** (lista fixa de ações
navegáveis) · **Gerar** (prompt → streaming palavra-a-palavra com cursor; **recusa fora de
escopo** vira estado próprio com mensagem de redirecionamento, não erro). Esc fecha e reseta modo.

**Painel do agente (validado):** timeline com **atribuição explícita de ator** (badge Você vs
Agente + ícone), status done/in-progress por item; busca híbrida RRF com **badge de fonte** por
resultado; geração de `SPEC:PAGE` com fases idle→streaming(skeleton→linhas)→done e ações
**Aceitar / Editar** — proposta do agente nunca se auto-aplica (`diretrizes-ux.md` §3).

## B1. Mensageria — T-MSG-01..03 (draft)

Fontes: inventário §B1 · mockup B1 (`23b89cf`) · `caderno-3-sdk/20` + `07-chat`.

**Lista de conversas (validado):** avatar-iniciais, preview truncado, hora, badge de não-lidas;
abrir zera não-lidas. **⚠ Gap §6:** mockup não tem estado vazio da lista — produção DEVE ter
(EmptyState com CTA "iniciar conversa"); "esqueci o estado vazio" é BLOCKER de review.

**Conversa (validado):** bolhas por autor (me/contato/**ai** com ícone e cor própria — atribuição
de ator §3; system = linha central); status de envio por mensagem **sending→sent→delivered→read**
(ícones ✓/✓✓; read colorido) — o `pending` local vs `finalized` durável do core aparece aqui.
Composer: textarea auto-crescente, Enter envia / Shift+Enter quebra, anexo, send desabilitado se
vazio. **Offline:** banner "mensagens serão enviadas ao reconectar" + envio continua funcionando
(fila) — UI otimista sempre. Grupo: avatares empilhados + autor acima da bolha.

**Chamada (validado):** 3 estados — recebida (aceitar/recusar) → 1:1 (remoto grande + self PiP) →
grade (tiles N participantes); controles mic/câmera/encerrar persistem entre estados.

**Não cobrido (detalhar ao endurecer):** falha de envio ("não entregue" + retry), indicador
digitando, presença efêmera real (T-MSG-03 — não replicada, opt-in), detalhe de contato/grupo,
encaminhar, galeria de mídia. **Pacotes:** LiveKit; design-system `Message`/`Avatar`/`Badge`.

## B2. Marketplace + Fintech — T-MK-02/03/06 (draft) · T-MK-01 (ready)

Fontes: inventário §B2 · mockup B2 (`563a0b7`) · `caderno-3-sdk/15`.

**Oversell (validado — requisito de CONTRATO, não só UI):** o estoque é **revalidado no momento do
submit** da compra (não só no render). Se esgotou entre o clique e a confirmação: erro explícito
"Este item acabou de esgotar" + garantia "nenhum valor foi cobrado do seu lado"; compra nunca
prossegue silenciosamente. Estados de vitrine: "Última unidade!" (aviso) e "Esgotado" (bloqueia
ações + CTA de alerta). Isso materializa o vetor de corrida de T-MK-02 na UI.

**Saga de pedido (validado; padrão transversal B2/B3/B6):** progresso pendente→pago→enviado como
pills com conector; falha → **compensado** com badge própria + banner explicando **o que foi
revertido** ("valor devolvido ao método original; item voltou ao estoque"). Compensado é terminal
(não avança). Disputa = flag paralela com badge, não substitui o estado da saga.

**Ofertas/lances (validado):** "Fazer oferta" (se `acceptsOffers`); lance superado → banner
"Sua oferta foi superada" + CTA de novo lance.

**Não cobrido:** régua de cobrança, multi-moeda/câmbio, cupom (vetor "cupom reusado" de T-MK-06
não tem tela). Instrumentos financeiros = placeholder declarado.

## B3. ERP/CRM — T-ERP-01..05 (draft)

Fontes: inventário §B3 · mockup B3 (`ac20437`) · `caderno-3-sdk/16`.

**Estoque multi-depósito (validado):** agrupado por SKU → cards por depósito com disponível;
reservar → modal → `qtyReserved`+TTL; card reservado exibe **TTL Lock** ("Reservado até…");
**reserva expirada** = badge de alerta "estoque deveria ser liberado" (borda dashed) — o LOCK de
T-ERP-02 tem representação visual própria nos 3 estados (livre/reservado/expirado).
Recálculo de projeção = SyncingState transitório, nunca bloqueia a lista.

**Validado ainda:** navegação por tabs (8 áreas); Financeiro e Conciliação como EmptyState "em
breve" (não mockados). Pipeline kanban, visão 360 e dashboards existem no mockup mas a mecânica
fina (drag entre etapas, custo de traversal) não foi auditada — detalhar ao endurecer T-ERP-04/05.

## B4. Contábil/Fiscal/RH — T-CFR-01..05 (draft)

Fontes: inventário §B4 · mockup B4 (`256a858`) · `caderno-3-sdk/17`.

**Período fechado (validado — invariante):** competência fechada é **read-only de verdade**:
tentar editar lançamento de período fechado **dispara aviso** (`role="alert"`: "pertence à
competência X (fechada). Reabertura requer administrador") — nunca disable silencioso. Card de
competência: badge Aberto/Fechado (com `closedAt`), totais receitas/despesas/resultado agregados.

**Fechar competência (validado):** DestructiveModal com aviso de irreversibilidade ("somente
leitura; reversível apenas por administrador"). Label do modal destrutivo é **parametrizável**
("Fechar competência", não "Excluir…" hardcoded — bug real corrigido no mockup).

**Lançamentos derivados (validado):** cada linha exibe a **origem** (`derivedFrom`) — contabilidade
é derivada de eventos, não digitada; filtros por conta e competência; recálculo retroativo =
ConfirmModal + SyncingState, com garantia "não altera período fechado".

**Não cobrido:** jurisdição ausente (degrada), conector fiscal ausente — vetores de T-CFR-05 sem
tela correspondente ainda.

## B5. Mapa — T-MAP-01 (ready) · T-MAP-02/03 (draft)

Fontes: inventário §B5 · mockup B5 (`5d577a1`) · `caderno-3-sdk/23`.

**Validado:** busca + lista ordenada por distância ↔ mapa com pins sincronizados (selecionar em um
destaca no outro); detalhe com salvar/rota. **Degradação parcial:** localização negada degrada SÓ
o widget de posição (ErrorState com retry + "usando última posição conhecida") — lista e mapa
continuam usáveis com cache; retry = SyncingState. Offline = banner "lugares salvos offline".
**Rota com proveniência:** resultado sempre nomeia o conector de origem + ressalva de atualidade.
**Compartilhar localização (efêmero §11 das diretrizes):** ConfirmModal com aviso explícito
(15 min, expira sozinho, revogável, "informação sensível") → badge TTL com hora de expiração +
botão Revogar sempre visível. Nunca persiste — é efêmero por design (T-MAP-03).

**Pacotes:** `maplibre-gl` (tiles reais); conector Classe E (T-MAP-02) com cache TTL.

## B6. Logística & Fulfillment — T-LOG-01..05 (draft)

Fontes: inventário §B6 · mockup B6 (`0a740b9`) · `caderno-3-sdk/25`.

**Fulfillment (validado):** três filas — Aguardando alocação / Em andamento / Concluídas &
disputas. Saga por entrega: aguardando→alocado→em rota→entregue (mesmo vocabulário visual de §B2).
**Sem entregadores** = EmptyState próprio ("todos ocupados ou offline") que **bloqueia a ação
Alocar** — disponibilidade honesta, sem fingir. Surge/pico altera a oferta de entregadores e o
repasse (modal de surge/repasse por entrega).

**Disputa/escrow (validado):** disputa é terminal alternativo da saga; card exibe nota "valor em
escrow **retido até resolução** — repasse ao entregador e crédito ao vendedor pausados".

**Não cobrido:** WMS fino (endereçamento, inventário cíclico), rastreio ao vivo no mapa,
cotação/etiqueta de transportadora, prova de entrega no app do entregador.

## B7. Social & Feed — T-SOC-02/03 (draft) · T-SOC-01 (ready)

Fontes: inventário §B7 · mockup B7 (`45dd2ec`) · `caderno-3-sdk/18`.

**Feed (validado):** posts ordenados por rank; cada card: autor→abre perfil, tempo relativo,
**visibilidade por post** (ícone+label público/conexões/privado), corpo, mídia, ações
curtir/comentar/compartilhar (curtir otimista com aria-pressed), overflow ⋯ →
compartilhar/denunciar (FormModal)/bloquear (DestructiveModal com efeito recíproco explicado).
**Slot de anúncio:** post com badge "Patrocinado" — mesmo container do post orgânico
(`aria-label="Publicação patrocinada"`), diferenciado só pela badge.

**Stories (validado):** rail com anel visto/não-visto; viewer fullscreen com barras de progresso
por story (5s auto-avanço), navegação por toque lateral/setas/Esc; **story expirado é honesto** —
placeholder "Este story expirou (24h)" no lugar do conteúdo; expirado não marca "visto" e pausa o
auto-avanço. Feed vazio = EmptyState com CTA Publicar.

**Não cobrido:** detalhe do post com thread de comentários (só toast no mockup — mecânica a
definir ao endurecer T-SOC-02), privacidade retroativa (vetor T-SOC-03 sem tela), conexões/
seguidores.

## B8. Streaming — T-STR-03 (draft, UI) · T-STR-01 (ready)

Fontes: inventário §B8 · mockup B8 (`692f393`) · `caderno-3-sdk/19` + `05-media-plane`.

**Validado:** Descobrir (ao-vivo-agora + canais + VOD grid) / Canal / Player / Live / Estúdio.
Player: **sem seeder P2P = degradação declarada** (badge no vídeo + estado "nenhum seeder —
tentando reconectar", play não finge); **renditions processando** = overlay "play indisponível";
buffering = spinner overlay que pausa o progresso; qualidade auto/1080/720/480; legendas
toggle com track aria-live; barra de progresso acessível (role=slider, setas ±5s); variante
áudio = waveform. Card de vídeo herda os estados (processando/ao vivo/duração).
**Live→VOD:** transmissão encerrada redireciona para o player VOD do mesmo conteúdo. Tip/gorjeta
por modal.

**Pacotes:** `hls.js` (adaptativo), LiveKit (live), `@plataforma/media`.

## B9. Anúncios — T-AD-02/03 (draft) · T-AD-01 (ready)

Fontes: inventário §B9 · mockup B9 (`0c28533`) · `caderno-3-sdk/29`.

**Campanhas (validado):** card com status + barra de orçamento; **verba estourada**
(`spent >= total`) tem precedência sobre o status do store: badge "pausada (orçamento esgotado)" +
barra vermelha + nota "parou de rodar automaticamente" — o pacing de T-AD-01 tem estado visual
terminal próprio.

**Segmentação bloqueada (validado — mesmo princípio do acesso negado A3):** flag
`targetingBlocked` → nota "alguns critérios não puderam ser aplicados — dado de origem restrito.
**Os critérios exatos não são exibidos**". A tela de segmentação declara: critérios são intenção;
anunciante nunca vê atributos individuais, só agregados.

**Anti-fraude (validado):** cliques suspeitos aparecem como **transparência, não erro**: "N
cliques suspeitos detectados e excluídos da cobrança"; métricas (CPC etc.) calculam sobre cliques
cobráveis. **Promover item existente (validado):** cria campanha que **referencia** o post/produto
(sem duplicar conteúdo). Criativo = preview com o mesmo vocabulário visual do PostCard do B7.

## B10. Email — T-EML-02/03 (draft)

Fontes: inventário §B10 · mockup B10 (`5ea8dfb`) · `caderno-3-sdk/21`.

**Validado:** lista agrupada por thread (1 linha por thread + contador), pastas
inbox/enviados/arquivo com badge de não-lidos, seletor multi-conta (com estado "sincronizando" por
conta) + "configurar nova conta IMAP/SMTP" (entra sincronizando→sincronizado). Thread: mensagens
colapsáveis (última aberta; abrir marca lida), arquivar/restaurar, responder.
**Envio é saga:** chip "enviando…" (pendente) → "enviado"; **falha não marca enviado** (vetor
T-EML-03). **Eco suprimido:** mensagem que voltou pelo próprio remetente ganha chip "eco
suprimido" + nota explicativa ("cópia local suprimida para não duplicar; reentregas P2P são
idempotentes — mesmo id = mesma mensagem"). **Compositor em overlay fullscreen** (exceção
"editor precisa de mais área", mesmo padrão do Studio); Esc fecha; validação inline.

**Decisão pendente:** o inventário lista modal "confirmar envio"; o mockup envia direto — fixar ao
endurecer T-EML-02 (recomendação: sem modal; a saga pendente já dá janela de percepção).

## B11. Calendário — T-CAL-02/03 (draft) · T-CAL-01 (ready)

Fontes: inventário §B11 · mockup B11 (`28b492e`) · `caderno-3-sdk/22`.

**Instâncias virtuais (validado — invariante central de T-CAL-01):** 1 linha persistida com
`rrule` → N ocorrências **calculadas em memória** para a janela visível (mês=42 dias, semana=7,
dia=1, agenda=30) — nunca materializar linhas por instância. Exceções ("excluir/editar só esta
ocorrência") são **overrides por chave `eventId+data`**, não mutação da série.

**Editar/excluir recorrente (validado):** evento com rrule sempre pergunta **"Esta ocorrência ou
toda a série?"**. Editar instância = padrão clássico: marca a ocorrência como exceção + cria
evento one-off (sem rrule) na data. Editar série = edita a linha original.

**Validado ainda:** 4 visões (mês com "+N mais", semana, dia, agenda agrupada); detalhe com RSVP
(aceitar/talvez/recusar, seleção única); **capacidade**: `booked >= capacity` → badge "Lotado
(N/N)" + alerta "novas inscrições bloqueadas" + form impede capacidade < já reservados; import
`.ics` marca origem no evento (badge "Importado de X"); editor de recorrência
(nunca/diário/semanal+dias/mensal). Legenda de ícones: recorrente/importado/parcial.

**Pacotes:** `rrule` (substituir o parser mínimo do mockup mantendo a mecânica de janela+exceção);
design-system `Calendar`.

## B12. Studio (Office & Criação) — T-OFF-02..05 (draft)

Fontes: inventário §B12 · mockup B12 (`4554147`) · `caderno-3-sdk/27`.

**Home (validado):** grid de arquivos com filtro por tipo (doc/planilha/slides/mídia), badge de
estado de sync por arquivo — **"mesclado"** (conflito CRDT resolvido automaticamente, badge
discreta, nunca erro — `diretrizes-ux.md` §1) e "sincronizando…". Novo arquivo via modal
(nome+tipo).

**Decisão de arquitetura (validada, reusada pelo Email):** editores abrem em **overlay
`fixed inset-0`** por cima do shell — máxima área útil sem quebrar as colunas; o shell permanece
montado atrás; Esc/voltar retornam ao estado exato.

**Mecânica dos editores (existente no mockup; auditar linha-a-linha ao endurecer):** doc com
blocos + backlinks (Automerge — T-OFF-02), planilha com fórmulas (motor first-party — T-OFF-03),
slides + export (T-OFF-04), mídia com IA via compute (T-OFF-05); presença multiplayer
(PresenceAvatars), indicador de salvamento (SaveIndicator), indicador de conflito
(ConflictIndicator), export e inserir mídia como modais.

## C. Catálogo transversal (padrões — mapear para `@plataforma/design-system`)

Fontes: inventário §C · `diretrizes-ux.md` §6 · mockup C (`62661fe`).

**Estados (validado, 7/7 do §6):** EmptyState (ícone+título+desc+CTA) · ErrorState (retry) ·
SkeletonCard (nunca spinner para conteúdo estruturado) · OfflineBanner · AccessDenied ·
SyncingState · PendingBadge/DoneBadge (pendente local vs finalizado durável). Extras validados:
**TTLLock** (reservado até…) e **SagaProgress + CompensationBadge** (§B2) — candidatos a
componentes novos no design-system (não existem lá ainda; os 45 atuais cobrem o resto).
**Modais:** Confirm/Destructive (label parametrizável!)/Form/Sheet/Wizard. **Menus:** contexto,
overflow ⋯, dropdown, comando. **Notificações:** toast/banner/badge/central.
