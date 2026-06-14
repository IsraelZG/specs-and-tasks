# Revisão: Inventário de Componentes & Layouts (`inventario-componentes-layouts.md`)

## 1. Validação da Ideia Central
O mapeamento exato segundo a taxonomia do Atomic Design (Atoms, Molecules, Organisms) atrelada à renderização em Colunas da RFC-026 garante a consistência visual massiva que a plataforma ambiciona. O insight de que "~80% de cada módulo é reuso de components compartilhados" prova matematicamente o ROI da engine *Spec-Driven*.

## 2. Refinamentos e Adições Sugeridas
- **GameEngine 2D/3D no Catálogo (Item 6.3):** A menção à GameEngine como "Lacuna a decidir" é o ponto de maior incerteza técnica. Para não atrasar o Design System, ela não deve ser um componente bloqueante. Recomendação: Definir a API de ponte (`postMessage` ou WASM Bridge) como Core, e tratar o React-Three-Fiber / PixiJS / Babylon como Plugin de Frontend Assíncrono (`ui` plugin) totalmente desacoplado da Library Central.
- **Micro-Interações e Acessibilidade:** O inventário lista os nomes, mas é crucial garantir que os *Atoms* definam não apenas o render visual, mas as *Aria-Labels* e os estados de pseudo-classe (`:hover`, `:focus-visible`, `:active`) de forma inviolável no pacote de Tokens.

## 3. Componentes Necessários Extras
- **Atom:** `KeyboardShortcutBadge` (Visualização unificada de atalhos para a Command Palette).
- **Molecule:** `DraggableItemWrapper` (Para padronizar o UX de "drag to share" da RFC-026 em toda a interface).
- **Organism:** `UniversalEmptyState` (Com IA Suggestion - "Você não tem faturas. Deseja que eu crie uma template?").
