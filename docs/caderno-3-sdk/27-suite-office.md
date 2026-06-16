# 27-suite-office.md — Suíte Office & Criação

> Fonte: RFC-025 (absorvida e deletada). Módulo de produto; é **aplicação do substrato** — motor de páginas (RFC-008), componentes (RFC-006), `ui` plugins (RFC-024), `compute`/IA (RFC-010/011), media plane (RFC-017), colaboração Automerge, conversores de export (skills docx/pptx/pdf). **Amenda a RFC-008** com perfis de capacidade. **Zero tipo de nó novo.** Onde não tocada, a doc vigente prevalece. Transversais posteriores a aplicar na absorção: o painel `editor` ocupa uma coluna do shell (RFC-026) e a command palette (RFC-026 A.8 / RFC-011 A.7) é a porta de geração/edição assistida por IA. (A sessão-doc colaborativa já referencia a RFC-027 A.4; os editores de mídia já são `ui` plugin pela RFC-024.)

---

## §1 — Perfis de capacidade do motor (emenda à RFC-008)

1. O motor de páginas é **único**; cada caso de uso é um **perfil de capacidade**: um subset de componentes permitidos + comportamento (linear vs. livre) + ações habilitadas. Perfis previstos: `pagina_completa` (tudo), `documento` (linear, subset Notion/Obsidian), `anuncio` (criativo + componentes), `slide` (apresentação), `comentario_post` (markdown simples). Ver [[perfil-de-capacidade]].
2. O perfil é declarado na `SPEC:PAGE`; o validador (RFC-008 A.7) aplica o subset do perfil. Trocar de perfil é restringir/relaxar, nunca trocar de motor.
3. Isso unifica páginas, artigos, docs Notion, anúncios e apresentações sob um motor — com WYSIWYG nosso e a autoria apontar-e-descrever (estilo Layrr) editando o mesmo `SPEC:PAGE`.

---

## §2 — Docs (Notion/Obsidian) e markdown simples

1. Doc rico = perfil `documento`: blocos como `CONTENT`, **colaboração Automerge**, e **backlinks nativos do grafo** (a plataforma *é* grafo — wiki-links/retrolinks de graça, no espírito Foam). Substitui Word; substitui parcialmente Excel quando o uso é texto+tabela leve.
2. **Markdown simples** (não o motor) onde basta: comentários, pequenos posts — rich-format leve sem o peso do editor de páginas.

---

## §3 — Bases e Planilha (fonte compartilhada)

1. **Planilha** = componente rico **first-party** com motor de fórmulas real + pontos ZEN (RFC-008 A.4) — uso convencional robusto (grade livre, fórmulas).
2. **Base (Airtable)** = view de **dados estruturados** (registros = nós sob uma `SPEC`, views tabela/kanban/calendário = páginas sobre projeções + JSON Forms).
3. **Fonte de dados compartilhada:** planilha e base podem ler o mesmo dado; e a **base pode ser uma view sobre a planilha** (a grade vira fonte estruturada). São duas lentes, não dois silos.
4. **Cálculo fora da main thread.** A reatividade da planilha é N:M (uma célula pode alterar milhares): o cálculo de fórmulas resolve a **topologia de dependências** fora da main thread (worker), paralelizando a cascata, para não bloquear a sessão Automerge nem o validador ZEN. (O motor de fórmulas é JS de componente rico; os pontos ZEN ficam dentro do envelope do componente — sem conflito com o orçamento de páginas da RFC-008.)

---

## §4 — Apresentações

Apresentação = `SPEC:PAGE` perfil `slide` (mesmo motor); **export para PDF/PPTX** por conversor no final (skills pdf/pptx). Sem engine de slides separada.

---

## §5 — Editores de mídia (imagem, vídeo, áudio)

1. **Imagem:** componente rico / `ui` plugin (canvas) + utilitários `compute` para IA (remover fundo, upscale, inpaint, estilo); texto sobre foto. Alimenta criativos de social/streaming e anúncios (RFC-015).
2. **Vídeo:** editor de timeline (`ui` plugin) + media plane (RFC-017) + `compute` (transcode, legendas via transcrição, cortes/efeitos IA); texto/overlay sobre vídeo.
3. **Áudio:** editor (`ui` plugin) + `compute` (denoise, transcrição, stems, geração).
4. Todos usam IA pelo **mesmo paradigma** (utilitário `compute`: local/peer/external/fila — RFC-010/011), sem mecânica nova.

---

## §6 — Outras ferramentas

Sobre o mesmo substrato: **gráficos** (componente rico alimentado por ZEN sobre projeções, geração por IA); **whiteboard/diagramação** (`ui` plugin canvas + Mermaid para diagramas estruturados, já usado em workflow RFC-022); **construtor de formulários** (especialização do page builder, JSON Forms — alimenta CRM/pesquisa); **PDF e e-signature** (componente + skill pdf — liga a contratos fintech/RH); **base de conhecimento/wiki** (docs em blocos + backlinks do grafo); **templates** (docs/slides/bases/páginas/workflows como SPEC distribuídos pelo marketplace de customizações).

---

## §7 — Colaboração e export

Colaboração em tempo real (docs, planilha, whiteboard) é **nativa via Automerge** (CRDT já no stack); a sessão de edição segue o modelo de doc colaborativo (RFC-027 A.4). Export é conversor (docx/pptx/pdf), não formato proprietário. Componentes ricos com camadas/objetos arrastáveis (editores de mídia, whiteboard) usam **session-locks efêmeros**: enquanto um peer manipula uma camada/objeto, ele a bloqueia para os demais; o lock é volátil (presença efêmera, RFC-018), não estado Automerge persistido. Evita conflitos de ordenação (ex.: Z-Index) que CRDTs de array convergeriam de forma visualmente incorreta.

---

## §8 — Limites honestos

1. Edição de mídia pesada (vídeo 4K, 3D) depende do hardware do device; degrada para utilitário `compute` em peer/fila (RFC-010) ou qualidade reduzida — declarado.
2. Export para formatos externos (docx/pptx) é conversão best-effort; fidelidade total a recursos proprietários do Office não é garantida.
3. Colaboração multiplayer herda os limites do Automerge (convergência eventual, sem ordem total global).
