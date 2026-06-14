# Revisão RFC-008: Linguagem de Páginas (UI Spec-Based)

## 1. Validação da Ideia Central
A ideia central de páginas autoradas e customizáveis em runtime, regidas por um validador estrito, recebeu uma evolução primorosa com a clareza da segregação de "Estado de Página vs. Sessão de Documento Colaborativo". A introdução do motor ZEN e formulários JSON schema garante segurança. E a novidade da "Geração por IA (Lovable)" com streaming progressivo é o estado da arte do mercado, feito de forma que preserva o modelo de segurança zero-trust. 

## 2. Refinamentos e Adições Sugeridas
- **Desambiguação do Lifecycle de Documentos Efêmeros vs Stateful (A.3):** A distinção entre estado visual-volátil (`state`) e estado do conteúdo colaborativo (`sessão-doc` RFC-027) é excelente. Recomenda-se estipular como um componente da página lê o Automerge-Doc sem quebrar a reatividade unificada da UI. O $bind ZEN deveria ter uma notação especial (ex: `$doc.title`) para reagir às mutations do CRDT.
- **Limites de Orçamento e Interrupção (A.2):** O L3 descreve orçamento de render. Expressões ZEN puras não travam, mas queries complexas aninhadas no TinyBase podem. Especificar um WebWorker para o Evaluator ZEN em árvores profundas, permitindo aborts sem congelar a main thread, fortaleceria o anti-abuso da UI.
- **Componentes Ricos (A.4):** A admissão de componentes com lógicas JS complexas no catálogo base (Codecs, Sheets) exige um Code-Splitting robusto para não inchar o bundle inicial. É crucial exigir `React.lazy` dinâmico ou equivalente para estes.

## 3. Design System & UI Layout
### Ideias de Layout
- Modo "Design / Developer": Como a página é declarativa, o usuário pode apertar um atalho que acende as bordas de todos os "Nós" da página, exibindo os IDs estáveis (L4) para que ele crie as variantes de overrides visualmente.
- Geração Live-Streaming (Lovable): Esqueletos Shimmer aparecem nas seções enquanto a IA preenche a árvore de componentes em tempo real (RFC-011).

### Componentes Necessários
- **Atoms:** `JSONFormWidget` (Polimórfico), `ExpressionErrorBadge` (Quando o ZEN dá overflow/throw).
- **Molecules:** `OverrideLayerPanel` (Mostra quais orgs estão modificando a view atual).
- **Organisms:** `PageRendererEngine` (O runtime interpretador da árvore).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** `SPEC:PAGE`
- **Arestas:** `EXTENDS` (permitindo customização de empresas sob a base).

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Criado nativamente por catálogo ou gerado pela IA (Intent submetido via Command Palette).
- **Mutação:** Propriedade reativa e customização hierárquica por Extends; a página base nunca é modificada pelo usuário da filial.
- **Fim de Vida:** Ao arquivar uma página, ela some da navegação mas mantém as respostas dos JSON Forms arquivadas em seus respectivos Data Schemas associados.
