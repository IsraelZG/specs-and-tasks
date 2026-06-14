# Revisão RFC-025: Suíte Office & Criação

## 1. Validação da Ideia Central
"Suíte Office não é subsistema novo, é o Motor de Páginas com Perfis de Capacidade". Essa afirmação é a coroa do Design Patterns da arquitetura. Reaproveitar `SPEC:PAGE` para ser um PDF, um Doc do Notion, uma Planilha e um Slide Deck garante que a IA, o Sistema de Automerge e as Regras de Permissão funcionem out-of-the-box para ferramentas inteiramente diferentes na visão do usuário final.

## 2. Refinamentos e Adições Sugeridas
- **Desempenho da Engine de Planilha First-Party (A.3):** Diferente de um documento linear, uma Planilha (Base de Dados) frequentemente aciona reatividade N:M (Uma célula altera milhares). O CRDT Automerge processando dezenas de milhares de operações matemáticas em cascata na mesma `Sessão` pode engasgar a Main Thread. O worker do Validador `Zen` deve paralelizar a topologia de dependências das fórmulas da planilha.
- **Prevenção de Conflito em Componentes Ricos (`ui` plugin):** Se dois usuários abrem um Editor de Imagem (`ui` plugin) num arquivo colaborativo Automerge e movem camadas simultaneamente, a intenção visual pode se destroçar em CRDTs de arrays (Z-Index). O `ui` plugin deve adotar *Session Locks* temporários (quem tocou a layer X a bloqueia enquanto segura o mouse), modelados via Intents Voláteis (Ephemeral Presence, RFC-018).

## 3. Design System & UI Layout
### Ideias de Layout
- Modo Distraction-Free (Notion-like): Interface com o mínimo de chrome possível para a edição de Documentos Livres.
- Contextual Toolbars: Barras de ferramentas Flutuantes (ex: formatação de texto) que aparecem adjacentes à seleção do usuário em vez de usar uma Faixa Fixa pesada.

### Componentes Necessários
- **Atoms:** `SlashCommandInput`, `CellReferencePill` (Planilha).
- **Molecules:** `RichBlockRenderer` (Lida com o Drag Handle do bloco de parágrafo).
- **Organisms:** `SpreadsheetGridEngine` (O terror do front-end, renderizando dezenas de milhares de divs virtualizadas), `SlideDeckPreview`.

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** O mesmo `SPEC:PAGE`, com restrição de Schema Variante baseada no *Perfil de Capacidade*.
- **Arestas:** `MENTIONS` (Backlinks de estilo Wiki / Roam Research entre docs), `INCLUDES` (Imagens/Vídeos associados do Media Plane).

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Criação do Documento no motor, acionando uma Sessão Colaborativa Automerge.
- **Mutação:** Histórico vivo editado por Peers (Live Sync). Snapshot estático para salvar `VERSION_TAGS`.
- **Fim de Vida:** Expurgados ativamente pelo autor ou perdurando como parte do cofre de conhecimento interconectado da Rede.
