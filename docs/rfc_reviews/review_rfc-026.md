# Revisão RFC-026: Shell de Aplicação e Composição de Módulos (NOVA)

## 1. Validação da Ideia Central
A concepção da Interface como uma Árvore FlexLayout (Painéis) controlada por Restrições Declarativas de Módulo e Solvers Determinísticos (onde Módulos e Funcionalidades tornam-se visualizáveis e empilháveis livremente) eleva a UI a um grau de "SO de Janelas no Browser" à la Arc Browser ou Raycast. O modelo de roteamento dinâmico e Command Palette integrados preenchem a lacuna técnica que faltava no front-end hiper modular.

## 2. Refinamentos e Adições Sugeridas
- **Gerenciamento de Foco e Render (A.9 e A.4):** Como as colunas colapsam em uma pilha visível (A.4.2), a DOM pode acumular dezenas de componentes pesados (WebGL maps, vídeos, gráficos). É imperativo que as colunas na Pilha de Colapsados entrem em modo *Sleep/Unmount* (A.9.2), mantendo apenas o Estado em Memória (Sessão), liberando GPU/RAM.
- **Arrastar e Soltar como Intents do Grafo (A.6):** Se o *Drag* é um *Intent Message* durável, cuidado: Arrastar um Lead errado para "Deletado" acidentalmente no meio do caminho lançaria um Comando Indesejado. A Interface deve exibir Overlays de Confirmação (Drop Zones coloridas e seguras com Time-Delay ou Botões "Desfazer") antes de transformar o evento UI num Intent irreversível do protocolo.
- **Sincronização de Estado de Workspace (`SPEC:WORKSPACE`):** Em ambientes multi-dispositivos simultâneos, se eu redimensionar uma janela no Desktop A, eu não quero que o Desktop B pule as colunas (quebra de foco). O Auto-Save do Workspace não deve emitir broadcasts forçados de Re-Render para outros terminais ativos do mesmo perfil; deve servir como estado estático inicial da próxima sessão.

## 3. Design System & UI Layout
### Ideias de Layout
- Resizer Bars Elegantes: As fronteiras entre colunas (splitters) devem possuir Snap points magnéticos.
- Mobile Footers Transformáveis: O Footer (Mobile) servindo como uma rampa que sobe para revelar menus modulares expansíveis.

### Componentes Necessários
- **Atoms:** `PanelGrabHandle`, `CollapsedPanelTab`, `ShortcutChip` (Para a Command Palette).
- **Molecules:** `OmnibarOmniSearch` (A interface fluída e rápida da Palette).
- **Organisms:** `FlexLayoutTreeSolver` (A super-div container que executa a matemática do layout).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** `SPEC:WORKSPACE` (Salvos como snapshots no Grafo de preferências do usuário).
- **Arestas:** Nenhuma diretamente nova, o Workspace faz bridging das configurações visuais da UI.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Instanciado na montagem da App (Workspace Default).
- **Mutação:** Alterações visuais são voláteis até que o usuário emita o Intent "Salvar Workspace".
- **Fim de Vida:** Deleção de perfis de Workspace. Sessões de colunas suspensas/fechadas perdem sua Tree de instâncias locais se não salvos.
