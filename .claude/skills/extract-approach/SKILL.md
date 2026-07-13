---
name: extract-approach
description: >
  Extrai uma abordagem reutilizável depois de resolver um problema não trivial. Use após decisões
  arquiteturais, diagnósticos difíceis, reworks repetidos, falhas de gate surpreendentes ou quando
  o usuário pedir aprendizados, manual operacional ou prevenção de recorrência.
---

# Extract Approach

Registre o aprendizado verificável da solução, não uma cadeia privada de pensamento. Capture o
procedimento, as evidências, os limites e a falha que ele previne.

## 1. Confirme que há algo para extrair

Só extraia depois de existir resultado ou evidência. Não transforme hipótese em regra.

- Se o aprendizado já está integralmente no artefato canônico, não duplique. Informe onde está.
- Se não há novidade reutilizável, encerre com `nenhuma extração adicional necessária`.
- Se a solução ainda não foi verificada, registre a pendência no artefato de trabalho; não publique
  uma regra permanente.

## 2. Roteie para o destino canônico

Escolha o primeiro destino que se aplica:

1. Rota específica de uma task endurecida: use `/wargame-task` e grave a seção 5b da task.
2. Armadilha de ambiente recorrente: atualize `PITFALLS.md`.
3. Invariante obrigatório do projeto: atualize `CLAUDE.md` ou o playbook diretamente relacionado.
4. Decisão arquitetural com alternativas e consequências: crie ou atualize uma ADR.
5. Procedimento recorrente executável por agentes: crie ou atualize a skill correspondente.
6. Aprendizado operacional sem destino existente: crie uma página curta em `docs/playbook/`.

Nunca crie um segundo documento se uma task, ADR, pitfall, conceito ou skill já é canônica para o
assunto. No repo Docs, não edite `status`, `INDEX.md` ou Log manualmente e não rode git.

## 3. Escreva somente o delta reutilizável

Use esta estrutura mínima, adaptando ao destino:

```markdown
## Problema recorrente
<sintoma observável e impacto>

## Evidência
<comando, teste, diff ou fato que estabeleceu a causa>

## Procedimento
1. <ação verificável>
2. <observação esperada>
3. <desvio provável e resposta>

## Regra preventiva
<regra curta, com escopo e condição de validade>

## Limites
<quando a regra não se aplica ou deve ser reavaliada>
```

Remova seções sem conteúdo. Prefira uma regra específica a conselhos como “tenha cuidado” ou
“teste melhor”. Não copie transcripts, raciocínio interno, segredos, tokens ou dados pessoais.

## 4. Red-team e valide

- Ataque a regra com um caso em que ela poderia produzir a ação errada.
- Restrinja o escopo até o contraexemplo deixar de invalidá-la.
- Rode o menor check que prova o artefato editado: links, parser YAML, teste da skill ou comando do
  playbook.
- Declare o que foi comprovado e o que continua inferido.

## 5. Persistência

No repo Docs, siga a fila serial de commits descrita em `CLAUDE.md`; nunca use git diretamente.
Se a extração pertencer a uma task, enfileire a intenção com o ID e todos os paths alterados.
