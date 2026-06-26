# 01 - Spec-Driven Development (SDD)

No SuperApp, **nenhuma linha de código é escrita sem uma especificação canônica**. O código é uma mera consequência mecanicista da spec.

## 1. A Fonte Única da Verdade

- A especificação (em `docs/conceitos/` e `docs/caderno-*/`) é a lei.
- O código e os testes devem refletir a spec com exatidão. Se o código diverge da spec (mesmo que o código pareça mais "eficiente" ou "correto"), o código está errado, a menos que uma RFC seja aberta para corrigir a spec.
- **Vibe Coding é estritamente proibido.** Não se deve adivinhar requisitos ou preencher lacunas de lógica sem que elas estejam cobertas por documentos de arquitetura.

## 2. Anatomia de uma Task (`tasks/T-*.md`)

As tasks são a ponte entre a arquitetura (Specs) e a execução (código). Elas devem seguir um formato rígido para garantir que o Agente ou Humano executor não crie alucinações.

Toda task contém:
1. **Ambiente de Execução**: Regras locais do pacote.
2. **Objetivo & Contratos**: As assinaturas Typescript ou interfaces que DEVEM ser estritamente cumpridas. Sem invenção de novos contratos.
3. **Contexto RAG**: Links para as specs canônicas de onde aquela feature foi extraída. Se a spec for ambígua, a task deve ser pausada.
4. **Escopo de Arquivos**: O que a task está autorizada a ler, criar ou modificar.
5. **Estratégia de Testes**: TDD é obrigatório. Os casos de teste são enumerados na task e devem ser fielmente implementados.
6. **Decisões em Aberto**: Se houver, a task não pode passar para `ready` até que o Arquiteto tome a decisão e a fixe.

## 3. O Fluxo de Trabalho (Workflow)

1. O Arquiteto escreve a Spec e deriva a Task.
2. O Agente ou Desenvolvedor lê o bloco RAG e o Contrato.
3. O Agente cria os Testes (falhos).
4. O Agente cria a Implementação.
5. O Agente valida a Implementação via CLI.
6. Se a spec apresentar falhas lógicas intransponíveis durante a codificação, o fluxo é abortado via `pause` (bloqueio). Não há improviso criativo.
