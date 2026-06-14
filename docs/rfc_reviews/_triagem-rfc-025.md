# Triagem — review da rfc-025 (Suíte Office & Criação)

**RFC:** `rfc-025` · **Achados extraídos:** 12

## Contagens por veredito
- INCORPORAR: 2
- UI->INVENTARIO: 6
- JA-COBERTO: 3
- REJEITAR: 0
- REVISAR-HUMANO: 1

## REVISAR-HUMANO (destaque)
- **025-09** — Aresta nova `INCLUDES` (mídia do Media Plane associada a `SPEC:PAGE`). Cria nomenclatura/mecânica de aresta de ontologia; a RFC declara **"zero tipo de nó novo"** mas é silenciosa sobre arestas. Decidir se `INCLUDES` é aresta canônica nova, se reusa uma aresta existente (ex.: `REFERENCES`/`ATTACHES`), ou se a associação mídia↔página é só payload. Não redigir norma — tensão com a precedência de ontologia (RFC-002/grafo).

---

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 025-01 | §2 Desempenho da engine de planilha first-party: cascata de fórmulas N:M na mesma sessão Automerge pode engasgar a main thread; o worker do validador ZEN deve paralelizar a topologia de dependências das fórmulas | INCORPORAR | A.3 §4 (novo bullet) | Verificado: não conflita com o orçamento ZEN da RFC-008 — o motor de fórmulas é JS de componente rico; os pontos ZEN ficam dentro do envelope do componente. **Refinamento normativo:** "4. A reatividade da planilha é N:M (uma célula pode alterar milhares): o cálculo de fórmulas resolve a topologia de dependências fora da main thread (worker), paralelizando a cascata, para não bloquear a sessão Automerge nem o validador ZEN." | [x] |
| 025-02 | §2 Prevenção de conflito em componentes ricos: editores `ui` plugin (ex.: imagem) sob Automerge podem destroçar intenção visual (Z-Index em CRDTs de array) quando dois usuários movem camadas; adotar Session Locks temporários (quem toca a layer X a bloqueia enquanto segura o mouse) via Intents Voláteis (Ephemeral Presence, RFC-018) | INCORPORAR | A.7 (novo bullet) | **Refinamento normativo:** "Componentes ricos com camadas/objetos arrastáveis (editores de mídia, whiteboard) usam **session-locks efêmeros**: enquanto um peer manipula uma camada/objeto, ele a bloqueia para os demais; o lock é volátil (presença efêmera, RFC-018), não estado Automerge persistido. Evita conflitos de ordenação (ex.: Z-Index) que CRDTs de array convergeriam de forma visualmente incorreta." | [x] |
| 025-03 | §3 Layout: Modo Distraction-Free (Notion-like) para edição de documentos livres — chrome mínimo | UI->INVENTARIO | inventario-componentes-layouts.md (Suíte Office, Layout) | Layout: `distraction-free` (chrome mínimo para perfil `documento` — RFC-025) | [x] |
| 025-04 | §3 Layout: Contextual Toolbars — barras flutuantes adjacentes à seleção, em vez de faixa fixa | UI->INVENTARIO | inventario-componentes-layouts.md (Suíte Office, Molecules) | Molecule: `ContextualToolbar` (barra flutuante adjacente à seleção — RFC-025) | [x] |
| 025-05 | §3 Atom: `SlashCommandInput` | UI->INVENTARIO | inventario-componentes-layouts.md (Suíte Office, Atoms) | Atom: `SlashCommandInput` (invocação de blocos/comandos no editor — RFC-025) | [x] |
| 025-06 | §3 Atom: `CellReferencePill` (Planilha) | UI->INVENTARIO | inventario-componentes-layouts.md (Suíte Office, Atoms) | Atom: `CellReferencePill` (referência de célula em fórmula — RFC-025) | [x] |
| 025-07 | §3 Molecule: `RichBlockRenderer` (lida com o Drag Handle do bloco de parágrafo) | UI->INVENTARIO | inventario-componentes-layouts.md (Suíte Office, Molecules) | Molecule: `RichBlockRenderer` (render de bloco rico + drag handle — RFC-025) | [x] |
| 025-08 | §3 Organism: `SlideDeckPreview` | UI->INVENTARIO | inventario-componentes-layouts.md (Suíte Office, Organisms) | Organism: `SlideDeckPreview` (pré-visualização do deck — RFC-025) | [x] |
| 025-09 | §4 Aresta: `INCLUDES` (imagens/vídeos do Media Plane associados a `SPEC:PAGE`) | REVISAR-HUMANO | — | Ver destaque acima: aresta de ontologia nova; tensão com "zero tipo de nó novo" / precedência de grafo. | [x] |
| 025-10 | §4 Aresta: `MENTIONS` (backlinks estilo Wiki/Roam entre docs) | JA-COBERTO | A.2 §1 | A RFC já normatiza "backlinks nativos do grafo (wiki-links/retrolinks de graça, espírito Foam)" em A.2 §1 — `MENTIONS` é a aresta que materializa esses backlinks, já previstos. | [x] |
| 025-11 | §3 Organism `SpreadsheetGridEngine` (grade virtualizada de dezenas de milhares de divs) | JA-COBERTO | inventario `SpreadsheetGrid` + A.3 §1 | Já no inventário como `SpreadsheetGrid` (Suíte Office) e como `SpreadsheetGrid` na lista de organisms compartilhados; A.3 §1 já define a planilha como componente rich first-party com motor de fórmulas. Sem linha nova. | [x] |
| 025-12 | §5 Mutação: snapshot estático salvo como `VERSION_TAGS` | JA-COBERTO | A.7 (Automerge) + A.8 §3 | O versionamento herda o modelo de doc colaborativo Automerge (A.7, sessão RFC-027 A.4); snapshots/tags de versão são propriedade do stack CRDT já adotado, não requisito novo da suíte. §5 do review apenas descreve o ciclo de vida que a RFC já delega a Automerge. | [x] |

**Σ vereditos = 12 = nº de achados extraídos.**
- INCORPORAR: 025-01, 025-02
- UI->INVENTARIO: 025-03, 025-04, 025-05, 025-06, 025-07, 025-08
- JA-COBERTO: 025-10, 025-11, 025-12
- REVISAR-HUMANO: 025-09
- REJEITAR: (nenhum)
