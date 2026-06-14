# Revisão RFC-006: Design System Canônico

## 1. Validação da Ideia Central
A ideia de adotar uma arquitetura de tokens em três camadas (Primitivos > Tema > Semântica) e compilação via Style Dictionary é excelente e adota padrões-ouro da indústria. O desacoplamento estrito entre `Módulo -> Engine -> Componente -> Token` assegura consistência visual e manutenibilidade em larga escala. A introdução de uma "camada de metadados AI-ready" é o grande diferencial, preparando o terreno para a geração de UIs por agentes.

## 2. Refinamentos e Adições Sugeridas
- **Clarificação sobre Shadcn vs. Tailwind:** O texto menciona componentes *shadcn-based*. Como shadcn depende pesadamente do Tailwind CSS, é vital definir expressamente se o Style Dictionary irá compilar variáveis injetadas direto no `tailwind.config.js` ou se usará uma abordagem de CSS modules pura.
- **Depreciação AI-ready:** Os metadados de catálogo (`ComponentIdentity`, `AIHints`) devem conter marcações explícitas de versão/depreciação (ex. `ReplacedBy`), garantindo que agentes de IA não gerem telas usando componentes legados.
- **Fallback Automático:** Caso um `CONTENT:THEME` injetado contenha buracos semânticos (ex: cliente configurou apenas a cor primária e esqueceu o resto), a engine de UI deve obrigatoriamente realizar um fallback silencioso e seguro para a raiz do tema `light` do core.

## 3. Design System & UI Layout
### Ideias de Layout
- UIs guiadas por metadados exigem espaçamentos previsíveis. A introdução de variáveis ortogonais de "Densidade" (Compact, Cozy, TV) resolve nativamente casos como telas de dashboards gerenciais vs. POS touch-screens.

### Componentes Necessários
- **Atoms:** `Button`, `Input`, `Label`, `Avatar`, `Badge`, `SkeletonLoader`, `Switch`, `Checkbox`.
- **Molecules:** `Toast`, `MessageBubble`, `NavItem`, `CardHeader`, `FormGroup`, `Breadcrumb`.
- **Organisms:** `Card` (SuperCard), `Dialog/Modal`, `NavigationSidebar`, `DataGrid`, `PageHeader`.

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `CONTENT:THEME` (payload carregando o override semântico de tokens, assinado pelo autor).
- **Arestas:** 
  - O tema age transversalmente, podendo ser vinculado ao nó `PROFILE` da organização ou usuário ativo via aresta `HAS_THEME`.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** O core dos primitivos nasce em tempo de compilação da plataforma.
- **Mutação/Supersessão:** Override por um cliente gera um novo nó `CONTENT:THEME`. Edições nesse tema não alteram o nó, mas geram novos nós, atados pelo ponteiro `SUPERSEDED_BY`, mantendo a reprodutibilidade gráfica de specs passadas.
- **Fim de vida:** Tokens antigos ou componentes depreciados permanecem no código por retrocompatibilidade, mas são marcados como obsoletos nos índices `components.index.json`.
