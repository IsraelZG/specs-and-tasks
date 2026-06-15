# Ordem de Absorção das RFCs (`/absorver-rfc`)
> Sequência topológica respeitando dependências: **transversais antes dos produtos**, e dentro de cada bloco a ordem em que cada RFC depende das anteriores. Cada `/absorver-rfc` gera os verbetes e aplica as edições de caderno descritas nas tabelas "Onde integrar" da RFC, **honrando as notas "a aplicar na absorção"** dos cabeçalhos de produto (precedência cruzada).

## Como ler
- Absorver **uma RFC por vez**, na ordem abaixo.
- Após cada absorção: rodar o auditor de wiki (links/RAG) antes da próxima.
- Onde uma RFC **emenda** outra já absorvida (ex.: 010 retro-fundamenta 007; 024 estende 010; 025 emenda 008), a emenda se aplica sobre o caderno já existente.

## Fase 1 — Transversais (fundação)

| # | RFC | Depende de (já absorvido) | Por que nesta posição |
| :--- | :--- | :--- | :--- |
| 1 | **006 Design System** | caderno-3/03, 04 | Catálogo/tokens; base de tudo que renderiza |
| 2 | **007 Conectores** | caderno-3/06 | Taxonomia A–E; independente de 006 |
| 3 | **010 Plugins & Computação** | 007 | Substrato de plugins; **retro-fundamenta** 007 (conector = plugin) |
| 4 | **008 Linguagem de Páginas** | 006 | Motor de páginas sobre o catálogo |
| 5 | **009 Jurisdição** | — (usa `EXTENDS`) | Necessária a 012/014 antes deles |
| 6 | **011 IA, RAG & Agentes** | 010, 008 | Inferência = utilitário compute; agente gera `SPEC:PAGE` |
| 7 | **022 Workflow** | 010, 008 (Zen) | Teto de processos; pré-requisito de 012/013/023 |
| 8 | **024 Plugins de Frontend** | 010, 008 | Categoria `ui`; página referencia componente isolado |
| 9 | **027 Módulos como Profiles** | 011 | Plano de comando + compartimentação; pré-requisito de 026 |
| 10 | **026 Shell & Composição** | 006, 008, 011, 027 | Composição em colunas; consome os anteriores |

## Fase 2 — Produtos

| # | RFC | Depende de (transversais + produtos) | Por que nesta posição |
| :--- | :--- | :--- | :--- |
| 11 | **012 Marketplace + Fintech** | 008, 009, 012-saga, 022, economia | Subgrafo transacional; base de 013/014/015/023 |
| 12 | **013 ERP/CRM** | 012, 022 | Terceira lente do subgrafo transacional |
| 13 | **014 Contábil/Fiscal/RH** | 013, 009, 007 | Deriva dos fatos operacionais; jurisdicional |
| 14 | **021 Mapa** | 007 (classe E), 026 | Consumível; **pré-requisito de logística** |
| 15 | **023 Logística** | 012, 013, 022, 021 | WMS/fulfillment/dispatch sobre os anteriores |
| 16 | **018 Mensagens** | caderno-3/07, 026 | Chat já especificado; base de DM/live-chat |
| 17 | **016 Social** | 008, 026, 018 (DM) | Valida `SuperCard`/feed; DM reusa 018 |
| 18 | **017 Streaming** | media plane, 010, 024, 018 (live-chat) | VOD/Live/Áudio |
| 19 | **015 Anúncios** | 012, 016, 017 (superfícies), 011 | Cross-módulo; depende das superfícies |
| 20 | **019 Email** | 007 (classe D) | Cliente real; conector espelho |
| 21 | **020 Calendário** | 022, 007 (classe D), 021 | Eventos; sync externo |
| 22 | **025 Suíte Office** | 008 (perfis), 024, 026, 011 | Aplicação do substrato; vem por último |

## Nota
A numeração das RFCs reflete a ordem de **criação**, não a de absorção. Esta tabela é a ordem de **absorção**. Discrepâncias conhecidas: 022/024/026/027 (transversais) têm número maior que vários produtos, mas precedem-nos na absorção.

> [!IMPORTANT]
> **Ordem de Absorção vs. Ordem de Build:** A ordem de absorção de cadernos (esta wiki) respeita a precedência conceitual e de escrita de especificações, sendo diferente da ordem dos marcos de build do produto (focada em marcos demonstráveis/milestones descritos em `plano-de-modulos.md`).
