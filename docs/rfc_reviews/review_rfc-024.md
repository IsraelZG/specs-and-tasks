# Revisão RFC-024: Plugins de Frontend (UI)

## 1. Validação da Ideia Central
A distinção dura entre "Páginas spec-driven" (Caminho seguro, RFC-008) vs "Componente Rico First-party" (Catálogo interno, auditado) vs "Escape Hatch em Iframe de Terceiros" (Sandbox cego) aborda cirurgicamente a paranoia de segurança web. Tratar games ou 3D complexos através de um `GameEngine` interno pilotado por Specs demonstra um pensamento purista data-driven e previne bloat indesejado.

## 2. Refinamentos e Adições Sugeridas
- **Message Bridge do Iframe (A.3):** A ponte `postMessage` entre a Sandbox de terceiro e a Host App precisa ser extremamente bem tipada e bidirecionalmente autenticada. É preciso se prevenir do ataque onde um iframe malicioso tenta dar flood de `postMessage` (denial of service no browser tab host). Sugere-se o uso estrito do `MessageChannel` e um limite de frequência por segundo.
- **Comunicação Inter-Iframes:** Um Iframe (Plugin UI A) pode querer conversar com outro Iframe (Plugin UI B) na mesma tela? Idealmente não: a plataforma atua como *broker* central (Redux/State global via Zen). Explicitamente, deve-se bloquear comunicação direta para evitar exfiltração colateral.
- **Armazenamento Local:** Componentes ricos e iframes vão tentar usar `localStorage` ou `IndexedDB`. Sendo um plugin sandbox (Tier restrito), o frame deve ser servido num host/dominio nulo (`null-origin` / sandbox flags) desabilitando armazenamento persistente opaco, obrigando tudo a passar pela ponte via `intents`.

## 3. Design System & UI Layout
### Ideias de Layout
- A transição entre o que é "Plataforma" e o que é o "Iframe" deve ser fisicamente visível (border sutil) para educar o usuário sobre a fronteira de segurança. Quando o Iframe solicita algo de risco, uma modal da plataforma host sobrepõe tudo.

### Componentes Necessários
- **Atoms:** `SandboxFrame` (Wrapper do Iframe), `PermissionLockIcon` (No canto da UI para auditar o plugin).
- **Molecules:** `PluginCrashBoundary` (UI de fallback tipo "Este componente quebrou. Recarregar?"), `GameEngineCanvas`.
- **Organisms:** `PluginPermissionManager` (O pop-up similar às extensões de browser: "PluginX quer ler o contexto de sua página. Permitir?").

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - Não há um nó novo, tudo flui por `SPECIFICATION` para referenciar o Plugin.
  - Eventos de jogo 3D / Ferramentas viram `CONTENT:INTENT`.
- **Arestas:** 
  - As UIs pesadas/Iframe injetadas na página são conectadas estruturalmente apenas como filhos temporários da árvore virtual da `SPEC:PAGE`. 

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Instanciado na montagem da tela (`mount`). O bridge liga.
- **Mutação:** Props reativas alteram o estado do Iframe, re-injetando dados pelo canal.
- **Fim de vida:** O estouro do "orçamento de recurso" (CPU abusiva) não crasha o App — o Iframe é implacavelmente destruído. A aba do cliente sobrevive e avisa o erro.
