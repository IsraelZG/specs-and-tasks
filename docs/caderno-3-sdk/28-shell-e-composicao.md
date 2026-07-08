# 28-shell-e-composicao.md — Shell de Aplicação e Composição de Módulos

> Fonte: RFC-026 (absorvida e deletada). Emenda `caderno-4-governance/02-module-architecture-and-code-splitting.md` (composição de módulos em painéis) e `caderno-3-sdk/03-engines-and-spec-driven-ui.md` (camada de composição acima das páginas). Apoia-se em RFC-008 (painel hospeda página/rota), RFC-006 (FlexLayout como engine de shell first-party), RFC-027 (painel hospeda profile de módulo; drag/share = comando) e RFC-011 (command palette → IA). Zero tipo de nó novo.

---

## §1 — Shell como árvore FlexLayout; `SPEC:WORKSPACE`

1. O shell é uma **árvore FlexLayout** de regiões/painéis (`flexlayout-react`, MIT, como renderizador first-party — não roda código de autor, é shell confiável). Cada **painel** binda **(módulo + página/rota + params)**; regiões aninham (coluna subdividida em rows), recursivamente.
2. **Estado vivo = efêmero** (regra da RFC-027: arranjo atual não é nó mutável replicado). **`SPEC:WORKSPACE`** é o layout **salvo** (durável, por usuário/perfil): o modelo serializável do FlexLayout vira payload de SPEC. Há um workspace **default** + **salvos nomeados** (trabalho, pessoal, por-projeto), múltiplos.
3. Snapshot: o estado vivo pode ser materializado num `SPEC:WORKSPACE`; restaurar um workspace reidrata a árvore (sessões efêmeras não-persistidas não retornam — §11).
4. **Sem broadcast multi-dispositivo.** O auto-save de `SPEC:WORKSPACE` **não** propaga broadcasts de re-render a outros dispositivos/terminais ativos do mesmo perfil: redimensionar ou rearranjar no dispositivo A **não** rearranja a sessão viva do dispositivo B (preservar foco). O workspace salvo é o **estado estático inicial** da **próxima** sessão a abri-lo — nunca um stream de mutações ao vivo entre dispositivos.

---

## §2 — Chrome como módulo

1. Header, menus laterais e footer **não são código de shell privilegiado** — são módulos comuns em regiões fixas do FlexLayout. São spec-driven, themeable (RFC-006), **filtrados por permissão** (o menu só mostra módulos a que o usuário tem acesso) e participam da mensageria (RFC-027). White-label troca o chrome editando spec, sem recompilar.
2. **Menu = um módulo, reposicionado por regime:** o menu lateral (desktop) e o footer de navegação (mobile) são **o mesmo módulo de menu**, colocado em região diferente conforme a largura (§5). Não há dois códigos de navegação.

---

## §3 — Restrições de layout declaradas e gerenciador determinístico

1. Cada módulo **declara no manifesto** suas restrições de layout: largura **mínima**, **mínima-para-ser-útil**, **preferida**, se **colapsa para trilho** (só ícones), se é **empilhável como row**, e se é **pinável**.
2. O **gerenciador de espaço é um solver determinístico**: dado (largura do viewport + painéis abertos + restrições + recência + pinos), produz um layout **reproduzível** — nada de heurística opaca. **Pino do usuário sempre vence recência.** Comportamento previsível é requisito: usuário precisa confiar em onde as coisas estão.
3. Menu lateral em estado convencional ocupa largura mínima (trilho de ícones); expandir revela texto/submenus, aumentando a coluna — caso direto do colapso-para-trilho declarado.

---

## §4 — Geração dinâmica de coluna e pilha de colapsados

1. Disposição default (desktop): menus nas extremidades; entre eles, **coluna Principal** (foco atual — social, marketplace, fintech) e **coluna Secundária** (comunicação/utilitários, subdividível em rows para mensagens, e-mail, notificações).
2. Selecionar um item (conversa, produto) **gera uma nova coluna** de detalhe. Sem espaço útil, o gerenciador **colapsa** o painel menos recente e não-pinado para uma **pilha visível de colapsados** (reabrível) — **nada se perde silenciosamente**. A decisão usa largura-mínima-útil + recência + pinos (§3).

---

## §5 — Responsividade contínua (desktop / tablet / mobile)

1. A responsividade é **contínua, dirigida por largura** — não layouts separados. Desktop/tablet exibem múltiplas colunas conforme a largura permite; **mobile é o regime degenerado**: tipicamente **um módulo por vez + footer**.
2. **Mobile:** os menus laterais tornam-se dinâmicos via **footer** (uma row do FlexLayout); acionar um item expande o menu para a tela inteira. Onde o desktop **abriria uma coluna lateral**, o mobile **oculta a vigente** para dar lugar ao novo conteúdo (ou **restaura uma coluna minimizada**) — foco na tarefa atual.

---

## §6 — Interação entre painéis: drag e share como comando

1. **Arrastar item entre colunas (desktop)** e **compartilhar item (mobile)** são a **mesma operação**: uma **mensagem de comando** ao profile do módulo de destino (RFC-027 A.2) — durável (intent) ou efêmera, conforme o caso. O gesto difere; a semântica não.
2. **Contrato de aceite declarado:** cada módulo declara os tipos de mensagem/payload que aceita. Assim o drag **destaca destinos válidos** e o share-sheet **lista destinatários válidos**. Mensagem não aceita = **falha controlada** (rejeição validada com feedback), nunca erro silencioso.
3. **Segurança de intent irreversível.** Para comandos **irreversíveis** (deleção, transição de estado destrutiva), o gesto de drag/share **não** emite o intent imediatamente: a UI exige confirmação via **drop zones explícitas e destacadas** e oferece **time-delay** ou **undo** antes de finalizar a mensagem de comando no protocolo. Gestos acidentais são recuperáveis; o intent durável só é emitido após a janela de desfazer.
4. **Payload referencia, nunca copia.** O payload da mensagem de comando carrega **referência ao nó do grafo** (o produto, o post, o evento), nunca uma cópia dos dados — mesmo princípio da promoção de anúncio (`RELATES:AD:PROMOTES`, caderno 29). O módulo de destino resolve a referência sob as permissões do usuário; se o destinatário não puder ler o nó, a ação falha de forma controlada (§6.2).
5. **Resolução de ação no destino.** Se o contrato de aceite do destino mapeia o `payloadType` para **uma única ação**, ela executa direto (com undo, §6.3). Se mapeia para **múltiplas ações**, a UI apresenta o menu de ações do contrato no ponto do drop (ex.: produto solto no chat → "enviar card" | "criar oferta"). A mecânica de interação (ghost, destaque de alvos, retorno animado) está em [`docs/mecanica-de-telas.md §T2`](../mecanica-de-telas.md).

### §6.1 — Matriz payload → ação (v1 mínima)

Cada módulo declara seus tipos no manifesto (contrato de aceite); esta é a cobertura mínima
esperada da v1 — a referência que os `AcceptContract` devem satisfazer:

| Payload (origem) | Módulo alvo | Ação criada |
|---|---|---|
| `marketplace:product` | Mensageria | enviar card do produto |
| `marketplace:product` | Anúncios | promover item (por referência) |
| `marketplace:product` | Social | rascunho de post com card |
| `marketplace:order` | Logística | criar/vincular entrega |
| `marketplace:order` | Fintech | cobrança / recibo / instrumento |
| `social:post` | Studio | abrir mídia do post no editor |
| `studio:file` | Social / Streaming / Email | publicar / anexar |
| `email:message` | Calendário | criar evento a partir do email (trecho citado) |
| `email:message` | ERP | criar pendência/ordem vinculada |
| `map:place` | Calendário | preencher local do evento |
| `map:place` | Mensageria | compartilhar local (efêmero, TTL) |
| `contact` | Email / Mensageria | nova conversa/email |
| `calendar:event` | Mensageria | enviar convite no chat |
| `streaming:content` | Anúncios | campanha pré-roll |

---

## §7 — Endereçabilidade e navegação

Cada painel é endereçável por **rota** (a página tem rota — RFC-008); o estado de workspace serializa para URL, habilitando **deep-link** ("abrir produto X numa coluna"), **compartilhamento de link** e **voltar/avançar** como navegação sobre estados de workspace.

---

## §8 — Camada de overlay e command palette

1. Acima da árvore FlexLayout há uma **camada de overlay** (não-coluna): modais, menus de contexto, toasts/notificações, ghost de drag, e a **command palette** (Cmd/Ctrl-K).
2. A palette é a **superfície de intenção em linguagem natural** — busca global, entrada de ação, e entrada de **geração-por-IA**. A *superfície* (palette, atalho, overlay) é desta RFC; o *comportamento de IA* (classificar intenção, gerar `SPEC:PAGE`/`SPEC:WORKFLOW`, recuperar) é da **RFC-011 A.7**.

---

## §9 — Ciclo de vida e multi-instância

1. O mesmo módulo pode ocupar **N painéis** (dois produtos lado a lado, como split-editor): cada painel tem **sessão própria** (doc efêmero — RFC-027 A.4), compartilhando o **profile (usuário × módulo)** (RFC-027 A.3).
2. Painel oculto/colapsado é **suspenso**: suspender significa **render-sleep** — o componente do painel é **desmontado** (libera GPU/RAM, relevante para painéis pesados: mapas WebGL, vídeo, gráficos), enquanto o **estado de sessão permanece em memória** (efêmero local). Painéis na **pilha de colapsados** (§4) sofrem a mesma suspensão; reabri-los **remonta** a partir do estado preservado, sem reinicializar a sessão.

---

## §10 — Acessibilidade

Navegação de foco entre colunas, troca de coluna/painel por teclado (paridade com editores de painéis), e regiões nomeadas para leitor de tela são requisito — herda os invariantes de acessibilidade da RFC-006 (que prevalecem sobre qualquer tema).

---

## §11 — Limites honestos

1. O solver é determinístico, mas **restrições mal declaradas** no manifesto degradam o layout — qualidade depende de bons manifestos.
2. Muitos painéis custam recurso; mitigado por suspensão (§9), não eliminado.
3. Deep-link restaura o **layout**; **sessões efêmeras não-persistidas não voltam** (comportamento esperado — persistir é opt-in, RFC-027 A.4).
4. Mobile sacrifica simultaneidade por foco — é a natureza do regime degenerado, declarada.
