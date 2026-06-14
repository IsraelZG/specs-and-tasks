# Revisão RFC-011: IA, RAG e Agentes de Plataforma

## 1. Validação da Ideia Central
Tratar inferência estritamente como "Utilitários de Compute" (RFC-010) limpa todo misticismo do LLM. Adicionar a 7ª projeção nativa (`vector_index`) para funcionar lado a lado com o `search_index_fts` eleva o RAG híbrido (Léxico + Vetor + Estrutura Graph) ao nível máximo de contexto semântico. A adoção da *Command Palette* (A.7) e os "Agentes Lovable" com teto de privilégio limitado ao do *Principal* dão ao sistema uma UX mágica sem explodir a segurança.

## 2. Refinamentos e Adições Sugeridas
- **Indexação Vetorial de Payload Criptografado (A.2):** O processo descrito diz que o embedding roda durante a decifra pelo Crypto Worker. Isso gera um gargalo de processamento *on-read* (ou pós-sync), forçando peers fracos a usar sua CPU em Background apenas para acompanhar a replicação do RAG. Um botão/flag de opt-in `Index Only When Searched` vs `Index Proactively` ou até um threshold para parar o RAG indexer se a bateria estiver baixa seria sensato no edge.
- **GraphRAG vs Custo Exponencial (A.3):** Fazer a fusão (RRF) navegando pelas arestas (traversal estrutural) soa excelente, mas no Automerge SQLite puro isso vira dezenas de `JOINs` recursivos em runtime. É imperativo que os "Paths" comuns de IA (ex: "Qual a fatura ligada a este pedido aprovada pelo gestor X") tenham Views Relacionais ou Índices Estruturais Específicos para ancorar o GraphRAG sem timeout.
- **Command Palette Intent Resolution (A.7):** A classificação de intent (Busca x Ação x Geração) em si mesma gasta calls para IA. Uma abordagem pragmática é rodar um modelo classificador SLM local de pouquíssimos parâmetros ou usar Heurísticas fortes antes de delegar a intenção abstrata para um LLM robusto externo.

## 3. Design System & UI Layout
### Ideias de Layout
- Command Palette Universal: Overlay no estilo Spotlight/Raycast, acessível em qualquer tela via Ctrl/Cmd+K.
- Render Progressivo de Tela (Geração IA): O esqueleto aparece com contornos animados enquanto os metadados (RFC-006) chegam e montam os átomos visuais interativos.
- Trilha de "Culpa" (Agentes): Qualquer transação assinada por IA brilha diferente, e ao passar o mouse revela "Ação efetuada por Agente GPT-4o sob a delegação de Maria Silva".

### Componentes Necessários
- **Atoms:** `AgentAvatarIcon`, `RAGScoreChip` (Mostrando quão relevante o documento é para a busca semântica).
- **Molecules:** `OmnibarInput` (Com placeholders rotativos dinâmicos).
- **Organisms:** `LovableUIPreview` (Sandbox para aceitar/recusar/alterar a página ou fluxo gerado pelo agente antes de fazer o "Commit" pro grafo).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** Intents (`CONTENT:INTENT`) gerados autonomamente com delegação, assinados.
- **Arestas:** Arestas entre Fatos de Negócio e o Log de Inferência da IA que fundamentou sua criação.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** O RAG ingere o Node após o descifrão. O LLM formula saídas baseadas no seu contexto, gerando páginas (`SPEC:PAGE`) ou intents voláteis.
- **Mutação:** As saídas de IA sofrem as exatas regras de Supersession de outputs humanos; a IA não cria verdades intocáveis.
- **Fim de Vida:** Expurgos de logs vetoriais acompanham os TTLs ou políticas de arquivamento dos documentos originais, evitando o inchaço desproporcional da 7ª Projeção (RTree/Faiss).
