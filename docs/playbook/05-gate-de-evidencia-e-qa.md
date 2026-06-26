# 05 - Gate de Evidência e QA

Para proteger a base de código (e garantir que agentes não cometam commits alucinados que quebram o repositório), aplicamos o conceito do **Gate de Evidência Inviolável**.

## 1. O que é o Gate de Evidência?

Nenhuma Task pode ser passada para a fase de `review` (`manage-task.mjs finish`) sem que o executor colete e **cole na mensagem do pull request/handoff** a saída terminal exata demonstrando sucesso no build e nos testes de sua unidade isolada.

O comando padrão é:
```bash
pnpm --filter <nome-do-pacote-afetado> build
pnpm --filter <nome-do-pacote-afetado> test
```
*Se a saída de qualquer um dos comandos retornar um `Exit Code` diferente de 0, a Task não terminou.*

## 2. TDD e Self-Checks

Todo código não-trivial deve deixar **um rastro testável** que falhará se a lógica for quebrada no futuro.
- Evite frameworks de fixtures pesados a não ser que o pacote já dependa deles.
- Um "Self-Check" simples ou assert puro é aceitável, contanto que seja automatizável via CLI.

## 3. O Fluxo de Review e Rework

O papel do Agente ou Humano Reviewer (`agile_reviewer`) é garantir que a arquitetura não apodreça e o Gate de Evidência foi cumprido.
- Se houver falhas, o Reviewer usa `request_changes` devolvendo a Task para a fase de `rework`.
- O Reviewer anota suas requisições com tags no formato `[Bn]` (Blockers), `[Mn]` (Major) ou `[mn]` (Minor) dentro do markdown da Task.
- A máquina de rework foca em consertar estritamente o que foi listado.

## 4. Auditorias e Verificações em Disco

Quando habilidades de checagem profunda forem invocadas, **confirme os dados lendo do disco real (`cat` / `view_file` / `read`)**. Relatórios sintéticos, invenção de diretórios (ex: citar "moldes de teste existentes" que não existem no File System) violam fatalmente as diretrizes de QA do monorepo.
