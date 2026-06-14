# Revisão RFC-022: Workflow e Orquestração de Processos

## 1. Validação da Ideia Central
Essa é talvez uma das abstrações mais vitais. Construir o workflow sobre event-sourcing derivado do grafo append-only elimina a necessidade de bancos duráveis paralelos como Cadence ou Temporal. A divisão em Nível 1 (Raso, abrange 90% dos casos) e Nível 2 (Statechart Harel completo via SCXML) provê uma rampa de complexidade suave, não sobrecarregando a engine com funcionalidades paralelas prematuras. 

## 2. Refinamentos e Adições Sugeridas
- **Recuperação de Deadlines (A.2):** O workflow depende de Deadlines baseados em HLC (Hybrid Logical Clocks). É necessário garantir que, se um peer despencar, outro peer consiga ressuscitar os timers daquele statechart. Isso exige que o registro do `deadline` seja publicado globalmente como fato ou projeção altamente distribuída, ou então os timeouts podem ser perdidos.
- **Versionamento de Workflows Ativos:** Um fluxo está rodando e a empresa publica uma V2 daquele processo (`SPEC:WORKFLOW` sofre supersede). O que ocorre com os processos (instâncias) in-flight? Migração automática de eventos passados para a nova MDE? Sugere-se uma política estrita: instâncias iniciadas terminam no modelo de SPEC na qual nasceram.
- **Ações Humanas em Sub-Workflows (A.4):** Se um sub-workflow trava aguardando `APPROVED_BY` de um perfil demitido/inexistente, a saga tranca? O Zen Engine e a SPEC precisam prever escalonamento padrão ("se X dias sem aprovação, encaminhar ao root").

## 3. Design System & UI Layout
### Ideias de Layout
- Visualização pura usando *Mermaid* para processos gerais; mas UIs de administração devem permitir arrastar setas entre caixas para desenhar o StateChart Nível 1, que é exportado como JSON por baixo.
- Trilhas de auditoria: Uma visualização visual tipo "Metrô/Caminho" das etapas que uma instância já percorreu.

### Componentes Necessários
- **Atoms:** `StatusStepIndicator`, `TimerCountdownBadge`, `TransitionArrow`.
- **Molecules:** `WorkflowNodeBox` (Caixa individual no diagrama mostrando estado atual), `ApprovalRequestBanner` (Para tarefas de humanos pausando a saga).
- **Organisms:** `VisualWorkflowEditor` (Baseado em Flow ou ReactFlow transformando arrastos na DSL da spec), `WorkflowInstanceAuditLog` (Lista cronológica de eventos de transição ocorridos + outputs Zen).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `SPECIFICATION:WORKFLOW` (O mapeamento/regras em si).
  - Intentions (`CONTENT:INTENT`) de transição.
- **Arestas:** 
  - O estado da máquina NÃO VAI PARA O GRAFO. É reconstruído puramente pela leitura (`fold`) dos eventos sequenciais de transição registrados sobre aquela instância. Uma lição magistral em segurança distribuída.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** O orquestrador dispara a instância via emissão de intent do evento raiz.
- **Mutação:** Transições emitem novos eventos (intents aceitos). O "Estado Atual" é apenas uma foto efêmera (uma View sobre a linhagem), logo mutação do estado é apenas adição na ponta da fita.
- **Fim de vida:** O estado atinge `Final/Terminated`. O log inteiro de eventos permanece arquivado para auditorias, cumprindo o design de Sagas limpas.
