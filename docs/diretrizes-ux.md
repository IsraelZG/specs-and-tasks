# Diretrizes de UX — regras para docs, specs e review de UI

> Princípios de design de interação **específicos desta plataforma** (P2P, local-first, baseada em
> grafo/CRDT, com agentes e capabilities). Entram no DoD de qualquer task `ui:true` e na checklist do
> `agile-reviewer`. Complementam os **Invariantes de TODA UI** do `plano-aplicacao.md` (i18n/tokens/a11y/responsivo).

## 1. Local-first & transparência de sincronização
- **UI otimista:** a ação reflete imediatamente no estado local; a sincronização é assíncrona. Nunca bloquear a UI esperando a rede.
- **Status de sync sempre visível** quando relevante: conectado/offline/sincronizando, e **pendente (local) vs finalizado (durável)** — herda a distinção do core (intents `pending` vs `finalized`).
- **Conflitos CRDT são resolvidos, não exibidos como erro:** quando o merge ocorre (Automerge/fork estrutural), a UI atualiza suavemente; só superfície quando exige decisão humana.
- **Offline é estado de primeira classe**, não erro: a app funciona; o que depende da rede é enfileirado e sinalizado.

## 2. Limites honestos (não fingir)
- **Sem progresso falso.** Barras/spinners refletem trabalho real. Operações longas (saga, renditions, Onda 0) mostram etapa real.
- **Disponibilidade honesta:** estoque/capacidade/seeder ausentes são mostrados como o que são (oversell evitado, "sem seeder → degradação declarada", story expirado some).
- **Privacidade/bloqueio como limite, não como ilusão:** conteúdo bloqueado ou privado simplesmente não aparece; nunca renderizar e depois esconder.

## 3. Atribuição de ator (humano vs agente)
- **Toda ação tem autor efetivo explícito:** ação direta do usuário vs **profile-delegado/agente** agindo por regra (caderno-4/02b §2.4). A UI nunca apresenta ação de delegado como ação direta do humano.
- **Agente de IA é visível e revogável:** quando um agente propõe/gera (ex.: `SPEC:PAGE`, co-edição), mostrar que é proposta do agente, com aceitar/editar e escopo (`ASSET:ROLE`) do que ele pode.

## 4. Capabilities & consentimento transparentes
- **Pedido de capacidade é legível:** todo prompt de consentimento (`ASSET:CONSENT`/UCAN) diz **o quê**, **para quem**, **por quanto tempo** e **revogável como**.
- **Revogação sempre acessível** e com efeito claro (incl. revogação por cortesia).
- **Sem acesso ≠ erro técnico:** "você não tem permissão" é um estado de UI desenhado, sem vazar a existência do dado restrito.

## 5. Performance percebida & orçamento
- **Metas medidas (T-903):** Onda 0 < 100 ms (malha quente) / < 500 ms (resume morno). A UI prioriza o caminho rápido.
- **Render progressivo sob orçamento:** o motor de páginas (T-PG) avalia ZEN sob orçamento e renderiza progressivamente — projetar para "primeiro conteúdo rápido, detalhe depois".
- **Skeletons, não spinners**, para conteúdo estruturado conhecido.

## 6. Estados completos (obrigatório por superfície)
Toda tela/lista define explicitamente: **vazio** (com CTA útil), **carregando** (skeleton), **erro** (com retry e causa legível), **offline**, **sem permissão**, **sincronizando**, e **parcial/pendente**. "Esqueci o estado vazio" é BLOCKER de review.

## 7. Internacionalização & RTL (ver Invariantes do roadmap)
- **6 locales de base** (pt-BR, en, es, fr, de, it); copy nasce nos 6.
- **RTL por construção:** propriedades lógicas CSS, ícones direcionais espelháveis por `dir`, nunca `left/right` físicos.
- **Formatação locale-aware** (datas/números/moeda) via `Intl`, moeda/jurisdição por [[jurisdicao]].

## 8. Acessibilidade (WCAG 2.1 AA — piso)
- Teclado em tudo; foco visível; ordem lógica.
- Contraste AA; **o usuário sempre pode forçar contraste/modo de acessibilidade localmente** (caderno-04 §, mesmo sob tema corporativo).
- Rótulos ARIA; alvos de toque ≥ 44px; respeitar `prefers-reduced-motion`.

## 9. Consistência via design-system
- **Só tokens `--ds-*`** (invariante I3, lint anti-literal T-DS-04). Zero cor/espaçamento literal.
- Customização hierárquica (app→módulo→página→componente) por atributo, herdando — não reinventar por módulo.
- Reusar o **catálogo de componentes** (`rfcs/inventario-componentes-layouts.md`); novas telas compõem, não criam átomos ad-hoc.

## 10. Responsividade & toque
- **Mobile-first contínuo** (T-SHL-03): multi-coluna ↔ coluna única; chrome reposiciona, não some.
- Gestos com equivalente acessível; sheets inferiores no mobile; densidade ajustável.

## 11. Consentimento de movimento & dados sensíveis
- **Localização e presença são efêmeras e sensíveis** (T-MAP/T-MSG): opt-in explícito, indicador "ao vivo", desligável.
- Compartilhamento é **comando explícito** (mensagem), com contrato de aceite e falha controlada — nunca silencioso.

---

> **Como aplicar:** o `agile-reviewer` valida 6–10 em qualquer task `ui:true`; 1–5 entram na spec da task
> como casos de teste/aceite quando a superfície os exercita. Ferramentas de apoio: skills `/design`
> (`design-critique`, `accessibility-review`, `ux-copy`, `design-handoff`).
