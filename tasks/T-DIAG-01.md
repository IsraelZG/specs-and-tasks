---
id: T-DIAG-01
title: "SPIKE: adoção controlada de Archify para artefatos arquiteturais"
status: draft:triaged
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: []
blocks: []
capacity_target: opus-spike
---

# T-DIAG-01 · SPIKE: adoção controlada de Archify para artefatos arquiteturais

## 0. Ambiente de Execução Obrigatório
- **Natureza:** tooling do repositório Docs; não cria worktree nem altera código do SuperApp.
- **Capacidade-alvo:** `opus-spike`; entregável = piloto reprodutível, artefatos derivados e decisão de adoção. Não torna Archify obrigatório.
- **Isolamento:** checkout/instalação temporária em `C:\tmp\t-diag-01-archify`; nunca instalar globalmente nem modificar configuração do usuário.
- **Versão:** fixar e registrar a release/commit exato no endurecimento; referência atual: [Archify v2.11.0](https://github.com/tt-a1i/archify/tree/v2.11.0).

## 1. Objetivo
Avaliar Archify como ferramenta opcional para agentes arquitetos produzirem diagramas técnicos derivados de
documentos canônicos. O piloto deve usar uma fonte real, validar `JSON IR → HTML/SVG`, testar atualização por
mudança restrita no JSON e decidir como versionar, revisar e publicar esses artefatos sem criar uma fonte de
verdade paralela.

## 2. Contexto RAG
- `docs/adr/0016-ui-engines-e-flow-grid.md` — fonte canônica do piloto: fronteiras entre Design System, `ui-engines`, páginas e plugins.
- `docs/caderno-3-sdk/10-design-system.md` e `docs/caderno-3-sdk/12-plugins-e-computacao.md` — tokens, engines, capability manifest e sandbox.
- `CLAUDE.md` §Wiki — prose normativa/ADR é canônica; diagramas são artefatos derivados, nunca substitutos.
- [Archify README v2.11.0](https://github.com/tt-a1i/archify/tree/v2.11.0) — JSON IR tipado, validadores, renderização HTML/SVG e CLI.
- [exemplo de pipeline JSON IR](https://github.com/tt-a1i/archify/blob/v2.11.0/examples/archify-repo.html) e [schema reference](https://github.com/tt-a1i/archify/tree/v2.11.0/docs) — referências de estrutura; não copiar estilo/código sem necessidade.

## 3. Escopo do Piloto
1. Criar `docs/diagramas/adr-0016-ui-boundaries.json` como fonte editável do diagrama e gerar `docs/diagramas/adr-0016-ui-boundaries.html` e `.svg` como derivados.
2. Mostrar no máximo 12 elementos: Design System, `@plataforma/ui-engines`, `@plataforma/pages`, plugin UI opaco, capability manifest, sandbox e seus fluxos/fronteiras. A fonte textual decide todos os elementos; lacunas viram anotação, não invenção.
3. Executar as validações/checagens do CLI da versão pinada contra o JSON e HTML/SVG; registrar comandos e saída literal.
4. Alterar uma propriedade localizada do JSON (posição, rótulo ou cor semântica), re-renderizar e demonstrar que o restante se mantém estável e revisável em diff.
5. Avaliar visualmente legibilidade em tema claro/escuro, export SVG, texto alternativo/descrição próxima ao artefato e `prefers-reduced-motion`; não usar animação como requisito.
6. Propor uma convenção mínima: quando usar diagramas, diretório/nomenclatura, JSON como fonte, HTML/SVG como derivados, como gerar no CI e como evitar artefatos obsoletos.

## 4. Critérios de Decisão
- `GO opcional` somente se o JSON, HTML e SVG forem gerados localmente sem rede durante renderização, passarem os validadores e forem revisáveis por diff.
- O diagrama deve explicar uma relação material que a prosa sozinha torna difícil; diagramas decorativos ou duplicação literal da ADR são `NO-GO`.
- Adoção não pode exigir skill global, serviço hospedado, fonte remota, fonte proprietária ou edição manual do HTML/SVG.
- O JSON/HTML/SVG deve declarar na primeira linha ou cabeçalho a fonte canônica e a versão/commit do Archify.
- Se uma mudança na ADR deixar o diagrama semanticamente desatualizado, a solução precisa oferecer um gatilho claro de atualização/review, não alegar sincronização automática inexistente.

## 5. Não Fazer / Pegadinhas
- **NÃO** alterar a semântica da ADR para caber no layout nem usar o diagrama como evidência arquitetural independente.
- **NÃO** instalar com `npx skills add ... -g`, copiar a skill para configurações globais ou adicionar dependência ao monorepo.
- **NÃO** gerar diagrama para toda ADR/RFC por padrão; gatilho inicial: arquitetura, fluxo de dados, sequência, ciclo de vida ou fronteira de segurança com relação 3+ difícil de ler linearmente.
- **NÃO** editar HTML/SVG derivado manualmente; corrigir somente JSON e renderizar de novo.
- **NÃO** incluir segredos, topologia de produção, IPs, identificadores de clientes ou detalhes de ataque em artefatos públicos.

## 6. Feedback de Especificação
O worker deve pausar se a ADR-0016 não fornecer elementos/relacionamentos suficientes para o piloto: registrar
a lacuna como feedback, sem inventar componentes. A decisão final pode ser `NO-GO`, ou restringir Archify a
documentos de arquitetura produzidos sob demanda por arquiteto/documentador.

## 7. Definition of Done
- [ ] JSON IR, HTML e SVG do piloto versionados sob `docs/diagramas/`, com link à fonte canônica e versão pinada.
- [ ] Saída literal de validação, renderização e checagem de artefato registrada na §8.
- [ ] Uma alteração localizada no JSON re-renderizada e conferida por diff.
- [ ] Avaliação de acessibilidade/legibilidade, peso dos artefatos e licença MIT registrada.
- [ ] ADR curta ou seção de decisão: `NO-GO | uso opcional`, gatilhos, convenção e responsabilidade de atualização.

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-16T18:20]** - *gpt-5* - `[Triado]`: Spike Archify triada: piloto derivado da ADR-0016, com JSON IR versionado e decisão de adoção opcional.
