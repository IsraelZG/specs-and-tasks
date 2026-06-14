# Revisão: Diff Consolidado — Preparativos de Módulos (`diff-preparativos-plano.md`)

## 1. Validação da Ideia Central
A consolidação de 96 tasks atômicas (`T-**-**`) divididas em P0 (Transversais/Fundação) e P1 (Produtos) traduz as 27 RFCs em um backlog acionável (Definition of Done prático). Essa abordagem "Spec-First" elimina a ambiguidade na passagem de bastão entre Arquitetura e Engenharia de Software.

## 2. Refinamentos e Adições Sugeridas
- **Riscos de Paralelismo (P0 vs P1):** A divisão sugere que os Módulos de P1 ficam bloqueados até que P0 inteiro termine. Contudo, em esquadrões ágeis, desenvolvedores de Front-End podem iniciar P1 "mockando" as interfaces de P0. Recomenda-se adicionar uma sub-faixa de "Mocking/Stubs" em P0 para que a construção de UI (P1) possa andar paralelamente ao SQLite/Crypto de P0.
- **Inclusão de Testes End-to-End (E2E):** O "DoD" menciona Protocolo/Cloud/UI da Bancada, mas não menciona as garantias E2E de integração. As tasks finais de P1 deveriam prever a intersecção de dois módulos (Ex: `T-MK-06` + `T-LOG-05` numa esteira contínua) para garantir que a Saga não quebre no meio do caminho no mundo real.

## 3. Design System & UI Layout
- O Backlog de UI é refletido nas Tasks `T-DS-*` e `T-SHL-*`. É importante que as Dailys e plannings usem o `inventario-componentes-layouts.md` como guia visual enquanto atacam as tarefas P0.

## 4. Ciclo de Vida do Backlog
Este documento deve ser transposto para um Jira / GitHub Projects e arquivado, virando a fonte da verdade para as Sprints M10 em diante.
