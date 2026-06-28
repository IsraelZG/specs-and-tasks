---
name: handoff
description: >
  Use esta skill quando o usuário quiser transferir o contexto da sessão atual para um novo agente,
  seja para trabalhar em uma tarefa paralela sem poluir o contexto atual, para separar um bug fix
  descoberto durante o trabalho principal, para enviar tarefas de prototipação a uma sessão dedicada,
  ou para passar aprendizados de volta a uma sessão anterior (handoff reverso). Gatilhos: "hand off",
  "handoff", "passa para outro agente", "cria um documento de handoff", "manda para outra sessão",
  "abre uma nova sessão para isso", "/handoff". NÃO use para compactar a sessão atual no lugar —
  use /compact para isso.
---

# Skill: /handoff

## Objetivo

Criar um documento Markdown compacto e orientado ao próximo agente, capturando apenas o que é
necessário para que uma **nova sessão** possa continuar um trabalho específico — sem arrastar todo
o contexto desnecessário da sessão atual.

---

## Quando usar

- Você identificou uma tarefa paralela (ex: refactoring, bug fix, GitHub issue) que está **fora
  do escopo** do objetivo principal da sessão atual e não quer diluir o contexto.
- Quer enviar parte do trabalho para um **agente diferente** (outra ferramenta, outra instância).
- Está em uma sessão de grilling/planejamento e quer **delegar a prototipação** para uma sessão
  separada, depois receber o resultado de volta.
- Quer fazer **revisão adversarial**: passar o contexto para um agente diferente (ex: Copilot CLI,
  CodeX) para obter outra perspectiva.
- A sessão atual está se aproximando da zona burra (~120k tokens) e você quer **preservar seu
  progresso** antes de compactar.

**Diferença crucial vs `/compact`:**
- `/compact` → continua a MESMA sessão, só resume o histórico.
- `/handoff` → cria um documento para uma NOVA sessão independente, mantendo a sessão atual intacta.

---

## Como executar

### 1. Identificar o foco do handoff

Se o usuário passou argumentos ou descreveu o propósito do handoff, **trate isso como a âncora
central do documento**. O documento deve ser escrito do ponto de vista do que o próximo agente
precisa saber para realizar **aquela tarefa específica** — não um dump geral da sessão.

Pergunte (ou infira do contexto):
- Qual é o objetivo da próxima sessão?
- Quais decisões tomadas aqui são relevantes para lá?
- O que o próximo agente NÃO precisa saber?

### 2. Estrutura do documento de handoff

Gere um arquivo Markdown com a seguinte estrutura:

```markdown
# Handoff: [Título descritivo da tarefa]

**Gerado em:** [data/hora]
**Sessão de origem:** [descrição breve do que estava sendo feito]
**Foco desta sessão:** [o que o próximo agente deve fazer]

---

## Contexto essencial

[Apenas o contexto necessário para a tarefa. Seja conciso. Use ponteiros para arquivos,
issues ou documentos existentes em vez de duplicar o conteúdo deles.]

## Estado atual

[O que já foi feito, decisões tomadas, o que está em progresso.]

## Tarefa

[Descrição clara e acionável do que o próximo agente deve realizar.]

## Restrições e decisões já tomadas

[Coisas que o próximo agente NÃO deve questionar ou refazer — decisões de arquitetura,
constraints de escopo, etc.]

## Arquivos relevantes

[Lista de arquivos, branches, PRs, issues ou URLs que o próximo agente deve consultar.
Use ponteiros — não copie o conteúdo aqui.]

## Sugestão de skills

[Skills que o próximo agente deve invocar ao iniciar, ex: /prototype, /grill, /diagnose]
```

### 3. Regras de qualidade

- **Ponteiros, não cópias.** Se algo já está capturado em um arquivo, issue ou PR, referencie-o.
  Não duplique o conteúdo.
- **Orientado ao foco.** Filtre o contexto da sessão inteira para incluir apenas o que é relevante
  para a tarefa específica do handoff.
- **Redija informações sensíveis.** Remova API keys, senhas, tokens, dados pessoais (PII) do documento.
- **Sugira skills.** Inclua uma seção com as skills que o próximo agente provavelmente vai precisar,
  para que o usuário não precise lembrar de invocá-las.
- **Seja conciso.** O documento deve ser pequeno o suficiente para caber confortavelmente no início
  de uma nova sessão (idealmente < 500 linhas).

### 4. Onde salvar

Salve o arquivo no **diretório temporário do sistema operacional** do usuário, NÃO no workspace:

```bash
# Linux/macOS
/tmp/handoff-[slug-da-tarefa].md

# Windows
%TEMP%\handoff-[slug-da-tarefa].md
```

**Motivação:** arquivos de handoff são descartáveis. Não devem ficar no repositório, acumulando
como documentação morta. Vivem apenas enquanto a transição entre sessões acontece.

Após salvar, informe ao usuário:
- O caminho completo do arquivo.
- Um resumo em 1–2 frases do que foi capturado.
- Como usar: "Passe o conteúdo deste arquivo para a nova sessão como primeiro contexto."

---

## Padrões de uso comum

### Padrão 1: Delegar tarefa paralela durante desenvolvimento

```
Usuário: "Percebi que preciso refatorar o módulo X, mas não quero perder o foco aqui.
          /handoff refatoração do módulo X para separar responsabilidades"
```

Agente cria um handoff focado APENAS na refatoração, sem o contexto da tarefa principal.

### Padrão 2: Handoff para prototipação durante grilling

```
Usuário: "Não sei ainda como implementar a comunicação entre janelas.
          /handoff prototipar a comunicação cross-window antes de continuar o planejamento"
```

Agente captura as perguntas em aberto e o contexto técnico relevante. O usuário abre uma
sessão de prototipação, resolve, e faz um **handoff reverso** de volta para a sessão de grilling.

### Padrão 3: Handoff reverso (resultado de volta ao pai)

```
Usuário: "Terminei o protótipo. /handoff de volta para o planejamento — captura tudo
          que aprendi que não está óbvio no código"
```

Agente documenta as decisões não-óbvias, surpresas e aprendizados para alimentar a sessão pai.

### Padrão 4: Handoff cross-agent (revisão adversarial)

O documento de handoff gerado pode ser passado para qualquer agente (CodeX, Copilot CLI,
Gemini CLI, etc.) — não precisa ser outro Claude Code. Isso é intencional: o formato Markdown
simples garante portabilidade total.

---

## Anti-padrões a evitar

- ❌ Salvar o handoff no repositório como documentação permanente.
- ❌ Copiar blocos de código longos que já existem em arquivos — referencie o arquivo.
- ❌ Incluir o histórico completo da conversa — filtre apenas o relevante para o foco.
- ❌ Esquecer de descrever o foco — sem ele, o documento fica genérico demais para ser útil.
- ❌ Incluir chaves de API, tokens ou senhas — redija sempre.
