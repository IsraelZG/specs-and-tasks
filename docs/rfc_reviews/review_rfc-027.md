# Revisão RFC-027: Módulos como Profiles e Mensageria Inter-Módulo

## 1. Validação da Ideia Central
Separar logicamente o Plano de Dados (Inalterado, sem APIs e compartilhado) do Plano de Comando (Mensageria e Profiles, onde Módulos = Atores) resolve a ambiguidade brutal sobre *quem* faz as transições numa arquitetura transversal. Instanciar um "Profile-Delegado Compartimentado (Usuário x Módulo)" acaba com o pecado capital de sistemas monolíticos onde a Engine tem God-Mode absoluto por padrão, bloqueando falhas de segurança colossais e escalonadas em P2P e SaaS.

## 2. Refinamentos e Adições Sugeridas
- **Explosão Combinatória de Profiles (A.3):** Se um usuário interage com 15 módulos (ERP, Chat, Maps, Docs...), são 15 instâncias de perfil-delegado atreladas à sua conta mestre. Isso afeta o payload de sincronização inicial. A governança da chave criptográfica (Keychain) deve rotacionar ou derivar sub-chaves do Usuário-Pai com facilidade para assinar sem exigir aprovação interativa constante na UI.
- **Diferenciação Visual de Intents de Módulos:** Como as operações (Comandos Duráveis) são formalizadas via intent assinada, ao rastrear a Linhagem/Audit Trail deve ser cristalino se foi o "João" clicando na tela, ou se foi o "Delegado CRM do João" agindo através de regras automáticas (Régua). Isso garante atribuição 100% segura para compliance de RH e Fisco.
- **Sinalização Efêmera de Coordenação:** Se um módulo "ERP" quer que a UI "Social" destaque o "Chat" (A.2), a RPC lateral (via sinal efêmero) precisa possuir um Registry padronizado. Comandos voláteis não documentados entre iframes levariam a comportamentos esotéricos na interface.

## 3. Design System & UI Layout
### Ideias de Layout
- Indicador Universal de Modo-Agente: Sempre que um módulo ou inteligência delegada executa algo por trás dos panos num documento aberto (Colab Mode A.4), a "Sombra do Profile Delegado" aparece na lateral com uma sutil animação brilhante, para dar total ciência ao usuário das ações assistidas ocorrendo em seu nome.
- Central de Permissões (App Store Settings): Uma página estrita onde o usuário vê todos os delegados (Módulos) vivos com os papéis (`ASSET:ROLE`) habilitados e botões de revogação.

### Componentes Necessários
- **Atoms:** `BotCursorIndicator`, `SystemMessageChip`, `ScopeRevokeButton`.
- **Molecules:** `ModuleActivityLog` (O que o Módulo ERP fez por você na última hora).
- **Organisms:** `CrossModulePermissionModal` (Uma tela de autorização OAuth-like quando um módulo novo pede acesso ou tenta uma nova delegação).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `PROFILE` (Criados sistematicamente para atuar como Módulos Escopados).
- **Arestas:** 
  - `DELEGATES_TO` (Aresta de confiança do perfil pai Mestre para o Perfil do Módulo).
  - Intentions Assinadas vinculadas de volta ao Perfil Delegado.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Instanciados implicitamente quando o usuário ativa ou entra no módulo pela primeira vez na plataforma.
- **Mutação:** O escopo do `ASSET:ROLE` pode sofrer ampliações via novos `SUPERSEDED_BY` na aceitação do usuário. Comandos duráveis seguem a regra append-only normal.
- **Fim de Vida:** Se o usuário desativar/remover o módulo (ou se expirar a cortesia), o Delegado sofre Revogação de Role (Lápide/Tombstone) perdendo permanentemente seus privilégios criptográficos, sem alterar retroativamente a legalidade de suas ações passadas.
