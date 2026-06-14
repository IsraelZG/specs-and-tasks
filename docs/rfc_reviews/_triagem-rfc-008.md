# Triagem — rfc-008 (Linguagem de Páginas / UI Spec-Based)

**Fonte:** `docs/rfcs/rfc-008-linguagem-de-paginas.md` + `docs/rfc_reviews/review_rfc-008.md`

## Contagens por veredito
- INCORPORAR: 4
- JA-COBERTO: 4
- UI->INVENTARIO: 6
- REJEITAR: 1
- REVISAR-HUMANO: 1
- **Total de achados: 16**

## REVISAR-HUMANO (destaque)
- **008-02** — Notação ZEN especial `$doc.title` para reagir a mutations do CRDT (sessão-doc/Automerge). Cria mecânica nova de binding reativo a uma segunda camada de estado (CRDT) ao lado de `sources`/`state`; toca a fronteira RFC-008 ↔ RFC-027 (sessão-doc) e o vocabulário `$bind`/`$zen`. Decisão arquitetural sobre o modelo de reatividade unificada — não redigir norma.

> Nota de auditoria de consistência: o suspeito conflito orçamento-ZEN × fórmula-de-planilha com a rfc-025 foi VERIFICADO como NÃO-conflito (motor de fórmula é JS de componente rico; pontos ZEN ficam dentro do envelope declarado do componente — A.4.2). Não levantado como REVISAR-HUMANO.

## Tabela

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 008-01 | Estipular como um componente da página lê o Automerge-Doc (sessão-doc) sem quebrar a reatividade unificada da UI (§2) | INCORPORAR | A.3 (item novo, §3) | "Componente que opera sobre uma **sessão-doc** (A.3.5) recebe a sub-árvore CRDT como fonte reativa do mesmo modo que `sources`: o runtime assina as mutations do Automerge e re-renderiza pela mesma via que TinyBase. A página não acessa o CRDT diretamente — declara a fonte editorial e o runtime unifica a reatividade." | [x] |
| 008-02 | Notação ZEN especial `$doc.title` para reagir a mutations do CRDT (§2) | REVISAR-HUMANO | — | Mecânica nova de binding a uma segunda camada de estado (CRDT) ao lado de `sources`/`state`; toca fronteira RFC-008 ↔ RFC-027 e o vocabulário `$bind`/`$zen`. Tensão: introduzir um terceiro namespace de fonte (`$doc`) vs. modelar a sessão-doc como `source` ordinária. Decisão arquitetural. | [x] |
| 008-03 | WebWorker para o Evaluator ZEN em árvores profundas, permitindo aborts sem congelar a main thread (§2) | INCORPORAR | A.2 (nota em L3) ou A.8 (T-PG-02) | "O avaliador ZEN deve ser interrompível sob o orçamento L3 sem bloquear a main thread (ex.: execução em worker), garantindo abort observável quando o orçamento de avaliação por ciclo de render estoura." | [x] |
| 008-04 | Premissa: ZEN puro não trava, mas queries aninhadas no TinyBase podem (§2) | JA-COBERTO | A.3.1 / L3 | A.3.1 já define que o runtime resolve `sources` (queries TinyBase) e A.2/L3 já impõe orçamento de avaliação por ciclo de render; o achado é justificativa do 008-03, não norma distinta nova. | [x] |
| 008-05 | Code-splitting robusto (`React.lazy` ou equivalente) para componentes ricos, para não inchar o bundle inicial (§2) | INCORPORAR | A.4 (item novo, §4) | "Componente rico deve ser carregado sob demanda (code-splitting / `React.lazy` ou equivalente): o catálogo distribui seu código de plataforma, mas o renderizador o resolve apenas quando uma página o referencia, mantendo enxuto o bundle inicial do renderizador." | [x] |
| 008-06 | Modo "Design/Developer": atalho acende bordas de todos os nós exibindo os IDs estáveis (L4) para criar overrides visualmente (§3) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Organismo · `NodeOutlineOverlay` (overlay de bordas + IDs estáveis dos nós da árvore, modo design) · módulo: SDK/renderizador de páginas | [x] |
| 008-07 | Geração Live-Streaming: esqueletos Shimmer nas seções enquanto a IA preenche a árvore (§3) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Molécula · `StreamingSkeleton` (shimmer por seção durante render progressivo da árvore) · módulo: SDK/renderizador de páginas + RFC-011 | [x] |
| 008-08 | Atom `JSONFormWidget` (polimórfico) (§3) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Átomo · `JSONFormWidget` (widget polimórfico de campo JSON Forms, A.6) · módulo: SDK/formulários | [x] |
| 008-09 | Atom `ExpressionErrorBadge` (quando o ZEN dá overflow/throw) (§3) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Átomo · `ExpressionErrorBadge` (sinaliza overflow de orçamento/throw de expressão ZEN) · módulo: SDK/renderizador de páginas | [x] |
| 008-10 | Molecule `OverrideLayerPanel` (mostra quais orgs modificam a view atual) (§3) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Molécula · `OverrideLayerPanel` (camadas de `EXTENDS` que sobrepõem a view atual) · módulo: SDK/renderizador de páginas | [x] |
| 008-11 | Organism `PageRendererEngine` (runtime interpretador da árvore) (§3) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Organismo · `PageRendererEngine` (runtime que interpreta a árvore, resolve `sources`, avalia ZEN, render progressivo — A.8 T-PG-02) · módulo: SDK/renderizador de páginas | [x] |
| 008-12 | Modelagem de grafo: nó `SPEC:PAGE`, aresta `EXTENDS` (§4) | JA-COBERTO | A.1.1 / A.1.2 | A.1.1 define a página como nó `SPECIFICATION (kind: PAGE)` e A.1.2 define customização via `EXTENDS`; o review apenas descreve o que a RFC já normatiza. | [x] |
| 008-13 | Ciclo de vida — Nascimento: criado por catálogo ou gerado por IA via intent (Command Palette) (§5) | JA-COBERTO | A.1.1 / A.7.3 | A.1.1 (publicação do nó SPEC:PAGE) + A.7.3 (geração por IA via intent sujeito ao validador) já cobrem nascimento; "Command Palette" é detalhe de UI, não norma nova. | [x] |
| 008-14 | Ciclo de vida — Mutação: customização hierárquica por EXTENDS, base nunca modificada pela filial (§5) | JA-COBERTO | A.1.2 | A.1.2 já estabelece overrides declarativos por `EXTENDS` com a base publicada separadamente; reafirmação, sem norma nova. | [x] |
| 008-15 | Ciclo de vida — Fim de vida: ao arquivar página, ela some da navegação mas as respostas dos JSON Forms ficam arquivadas em seus Data Schemas associados (§5) | INCORPORAR | A.7 (item novo, §7) | "Arquivar uma `SPEC:PAGE` a remove da navegação sem afetar dados: as respostas de formulários (A.6) já são nós alvo independentes, governados por suas próprias `SPECIFICATION`/data schemas, e permanecem pelo ciclo de vida normal do grafo. A página é uma view sobre os dados, não sua dona." | [x] |
| 008-16 | (§5) Reafirmação de que mutação é "propriedade reativa" da página | REJEITAR | — | Não é recomendação acionável — descreve comportamento de reatividade já implícito em A.3; nada a incorporar. | [x] |

---

### Verificação
- Σ vereditos = 16 = nº de achados extraídos. ✔
- JA-COBERTO confirmados por Grep na RFC (streaming A.7.3; EXTENDS/SPEC:PAGE A.1; sessão-doc A.3.5). ✔
- Conflito ZEN×rfc-025: verificado como NÃO-conflito na auditoria; não levantado. ✔
- `git add`/commit NÃO executados (override do orquestrador — batch-commit).
