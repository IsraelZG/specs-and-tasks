# Triagem — rfc-024 (Plugins de Frontend / UI)

**RFC:** `rfc-024-plugins-frontend.md` · **Review:** `review_rfc-024.md`

## Contagens por veredito
- `INCORPORAR`: 5
- `JA-COBERTO`: 4
- `UI->INVENTARIO`: 5
- `REJEITAR`: 0
- `REVISAR-HUMANO`: 1
- **Total de achados:** 15

## REVISAR-HUMANO (decisão arquitetural pendente)
- **024-15** — §4 do review afirma que UIs pesadas/iframe são "filhos temporários da árvore virtual da `SPEC:PAGE`", conectadas estruturalmente. Isso descreve mecânica de modelagem de grafo (aresta estrutural temporária para conteúdo de plugin) não normatizada na RFC, que declara "Zero tipo de nó novo" mas não trata de arestas para sub-árvore de iframe. Tensão: é aresta de grafo persistida ou apenas montagem efêmera de runtime (sem nó/aresta)? Requer decisão sobre ontologia antes de redigir norma.

## Tabela de achados

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 024-01 | §2 — Ponte `postMessage` deve ser extremamente bem tipada e bidirecionalmente autenticada | INCORPORAR | A.3 §1 (editar) | "A bridge `postMessage` é fortemente tipada (esquema declarado no manifesto) e **bidirecionalmente autenticada**: host e plugin verificam a identidade do par a cada mensagem; mensagens fora do esquema declarado são descartadas." | [ ] |
| 024-02 | §2 — Prevenir flood de `postMessage` (DoS na aba host); usar `MessageChannel` e limite de frequência/s | INCORPORAR | A.3 §1 (editar — refinamento de sandbox) | "A comunicação host↔plugin usa um `MessageChannel` dedicado (porta isolada, não o `window.postMessage` global) com **rate-limit por segundo** imposto pelo host; um plugin que excede o teto de mensagens é throttled e, persistindo, suspenso (A.3.3), protegendo a aba host de denial-of-service." | [ ] |
| 024-03 | §2 — Bloquear comunicação direta inter-iframes; plataforma como broker central (state global via ZEN) | INCORPORAR | A.3 §1 (editar — refinamento de sandbox) | "Comunicação **direta entre iframes de plugins** é proibida: dois `ui` plugins na mesma tela nunca trocam mensagens entre si. A plataforma é o **broker único** — toda coordenação passa pelo state global (ZEN) e pelo pipeline de intents (A.3.2), eliminando exfiltração colateral entre plugins." | [ ] |
| 024-04 | §2 — Iframe de tier restrito servido em `null-origin` / sandbox flags, sem `localStorage`/`IndexedDB`, forçando estado pela ponte | INCORPORAR | A.3 §1 (editar — refinamento de sandbox) | "O iframe sandbox é servido em **origin nulo** (`sandbox` sem `allow-same-origin`), desabilitando `localStorage`, `IndexedDB` e qualquer armazenamento persistente opaco. Todo estado do plugin atravessa a bridge via props (entrada) e intents (saída) — não há canal de persistência fora do controle do host." | [ ] |
| 024-05 | §3 — Fronteira Plataforma/Iframe fisicamente visível (border sutil) para educar o usuário sobre limite de segurança | UI->INVENTARIO | `inventario-componentes-layouts.md` | `SandboxFrame` (organism, módulo Plugins-Frontend): wrapper de iframe com borda/affordance visível de fronteira de segurança. | [ ] |
| 024-06 | §3 — Quando o iframe solicita algo de risco, modal da plataforma host sobrepõe tudo | UI->INVENTARIO | `inventario-componentes-layouts.md` | `PluginPermissionManager` (organism, módulo Plugins-Frontend): pop-up estilo extensão de browser ("PluginX quer ler o contexto da sua página. Permitir?"), modal host sobre o iframe. | [ ] |
| 024-07 | §3 — Atom `SandboxFrame` (wrapper do iframe) | UI->INVENTARIO | `inventario-componentes-layouts.md` | (consolidado em 024-05 como organism `SandboxFrame`; nota: review classifica como atom, inventário trata como organism wrapper de plugin) | [ ] |
| 024-08 | §3 — Atom `PermissionLockIcon` (canto da UI para auditar o plugin) | UI->INVENTARIO | `inventario-componentes-layouts.md` | `PermissionLockIcon` (atom, compartilhado): ícone de cadeado/estado de permissão no canto do frame de plugin para auditoria. | [ ] |
| 024-09 | §3 — Molecule `PluginCrashBoundary` (fallback "componente quebrou — recarregar?") | UI->INVENTARIO | `inventario-componentes-layouts.md` | `PluginCrashBoundary` (molecule, módulo Plugins-Frontend): UI de fallback de crash de plugin com ação de recarregar. | [ ] |
| 024-10 | §3 — Molecule `GameEngineCanvas` | JA-COBERTO | — | Inventário §3 já lista `GameEngine` (2D/3D, RFC-024 A.5) como organism compartilhado; o canvas é a superfície de render do mesmo componente rico (RFC A.5). Sem linha nova. | [x] |
| 024-11 | §1 — Validação: distinção página-spec / first-party / iframe-escape-hatch e games via `GameEngine` | JA-COBERTO | A.1, A.4, A.5 | A RFC já define o espectro de confiança (A.1), o critério página-vs-iframe (A.4) e games data-driven via `GameEngine` (A.5). Achado é elogio/validação. | [x] |
| 024-12 | §4 — Sem nó novo; tudo flui por `SPECIFICATION` para referenciar o plugin | JA-COBERTO | Precedência + A.1/A.2 | A RFC declara explicitamente "Zero tipo de nó novo" (cabeçalho) e que a página referencia o plugin pela mesma sintaxe de catálogo (A.1). | [x] |
| 024-13 | §4 — Eventos de jogo 3D / ferramentas viram `CONTENT:INTENT` | JA-COBERTO | A.3 §2, A.5 §3 | A RFC já normatiza que o plugin/`GameEngine` só **emite intents** pela ponte (A.3.2) e que `GameEngine` emite intents de pontuação/conquista/compra (A.5.3). | [x] |
| 024-14 | §5 — Ciclo de vida: mount liga a bridge; props reativas re-injetam estado; estouro de orçamento destrói o iframe sem crashar o app | JA-COBERTO | A.3 §3 | A RFC já normatiza orçamento de recurso imposto pelo host, com suspensão do plugin (não do app) no estouro (A.3.3); props de entrada via ZEN em A.2. Descrição de runtime, sem norma nova. | [x] |
| 024-15 | §4 — UIs pesadas/iframe modeladas como "filhos temporários da árvore virtual da `SPEC:PAGE`" (aresta estrutural) | REVISAR-HUMANO | — (ver bloco acima) | Mecânica de grafo não normatizada: aresta persistida vs. montagem efêmera de runtime. Exige decisão de ontologia. | [x] |

---
**Σ vereditos = 15 = nº de achados.** (INCORPORAR 5 + JA-COBERTO 4 + UI->INVENTARIO 5 + REJEITAR 0 + REVISAR-HUMANO 1)
