# ADR 0016 — UI Engines compartilhadas e FlowGrid determinístico

- **Status:** Aceita (2026-07-13)
- **Contexto:** Estaleiro + SuperApp; corrige duplicação de componentes funcionais e substitui o editor visual JDM inadequado.
- **Decisor:** Israel (arquiteto da plataforma)
- **Relacionadas:** ADR 0013 §1, ADR 0014, caderno-3-sdk/03, caderno-3-sdk/24 e RFC-018 Estaleiro.

---

## Contexto

O SuperApp já define uma camada de engines funcionais reutilizáveis entre módulos — shell,
formulários dirigidos por SPEC, cards polimórficos, timelines, kanban, grafos e visualizadores de
workflow. Entretanto, o Estaleiro implementou versões locais de shell FlexLayout, board, árvore de
execução, terminal, navegador de conhecimento e dashboards sem consumir essa camada.

Ao mesmo tempo, o editor de planejamento do Estaleiro adotou `@gorules/jdm-editor`. A biblioteca não
entregou a interação e a previsibilidade necessárias. O problema é do editor, não do modelo de
decisão: o Zen Engine e os grafos JDM continuam válidos para avaliação determinística, conforme ADR
0014. Também não é desejável criar um segundo editor ReactFlow para `SPEC:WORKFLOW`.

## Decisão

### 1. Camada de pacotes

A hierarquia canônica passa a ser:

```text
app/módulo (wrapper e adapters de domínio)
  → @plataforma/shell e @plataforma/ui-engines
    → @plataforma/design-system
      → tokens semânticos
```

- **`@plataforma/design-system`**: tokens, atoms e molecules sem regra de negócio.
- **`@plataforma/ui-engines`**: componentes funcionais React, agnósticos de domínio, que compõem o
  design system e expõem slots, eventos e adapters.
- **`@plataforma/shell`**: engine de composição FlexLayout, lifecycle e persistência abstrata de
  workspaces.
- **Apps/módulos**: stores, HTTP/WS, tipos e regras do domínio. TinyBase/localStorage do Estaleiro
  não atravessam a fronteira do pacote compartilhado.

React não será introduzido em `@plataforma/core`; o path histórico `packages/core/src/engines` é
substituído por `packages/ui-engines`.

### 2. `FlowGrid` é o editor e visualizador gráfico canônico

`@plataforma/ui-engines` fornecerá `FlowGrid`, usado tanto em modo de edição quanto de execução.
Ele recebe um view-model agnóstico e nunca lê JDM, `SPEC:WORKFLOW`, TinyBase ou APIs diretamente.

```ts
export type FlowNodeKind = "rule" | "tool" | "state" | "human";

export interface FlowGraphNode {
  id: string;
  kind: FlowNodeKind;
  label: string;
  order?: number;
  inputPorts?: string[];
  outputPorts?: string[];
  metadata?: Record<string, unknown>;
}

export interface FlowGraphEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  label?: string;
}

export interface FlowGraphViewModel {
  nodes: FlowGraphNode[];
  edges: FlowGraphEdge[];
}
```

O layout não persiste coordenadas X/Y:

1. valida o grafo e rejeita ciclos no v1;
2. calcula a coluna por profundidade topológica (`0` para raízes;
   `1 + max(profundidade dos predecessores)` para os demais);
3. ordena linhas de uma coluna por `order` e, como desempate, `id`;
4. mostra paralelismo na mesma coluna, bifurcações `1→N` e joins `N→1`;
5. desenha arestas numa camada SVG sobre CSS Grid;
6. em execução, sobrepõe estado `blocked | ready | running | done | failed` e destaca o nó atual.

Loops não entram como back-edge no v1. Repetição usa `invoke_workflow` com orçamento explícito; isso
mantém cada execução como DAG observável e evita que a UI normalize loops ilimitados.

### 3. Adapters preservam os modelos de domínio

- **Estaleiro:** adapter `plugin-workflows/JDM → FlowGraphViewModel`; comandos de edição voltam ao
  formato aceito pelo store do plugin.
- **SuperApp:** adapter `SPEC:WORKFLOW → FlowGraphViewModel`; a fonte da verdade permanece a SPEC e
  seu estado event-sourced.
- **Knowledge graph e outros grafos:** podem reutilizar primitivas visuais, mas `RelationGraph`
  continua sendo o renderer livre para redes sem progressão topológica.

`FlowGrid` não decide regras, não executa tools e não é storage. O Zen Engine continua avaliando JDM;
o orquestrador da ADR 0014 continua executando handlers assíncronos.

### 4. Migração incremental

1. Criar `@plataforma/ui-engines` e o contrato agnóstico.
2. Implementar `FlowGrid` com testes da função pura de layout e smoke no browser.
3. Substituir `@gorules/jdm-editor` e o `WorkflowTree` hardcoded no Estaleiro por adapters para a
   mesma engine; remover a dependência do editor.
4. Extrair funcionalidades existentes somente quando forem tocadas ou tiverem segundo consumidor.
   Não haverá reescrita geral das views do Estaleiro.
5. `EST-29` é seed de `@plataforma/shell`; layout default do Estaleiro permanece no app.

## Consequências

### Positivas

- Uma única linguagem visual para tasks, workflows e execuções.
- Layout reproduzível, diffável e sem coordenadas frágeis.
- Estaleiro passa a incubar engines que o SuperApp realmente reutiliza.
- O modelo de workflow deixa de depender da biblioteca escolhida para editar.

### Negativas

- É necessário manter adapters separados para JDM e `SPEC:WORKFLOW`.
- O v1 não representa ciclos visuais; workflows cíclicos precisam ser refatorados para invocação
  limitada ou aguardar uma extensão explícita do contrato.
- A migração remove código `done`, mas de baixa qualidade; exige gate visual para não trocar um
  editor ruim por uma grade apenas cosmeticamente correta.

## Alternativas rejeitadas

| Alternativa | Razão |
|---|---|
| Manter `@gorules/jdm-editor` | Fit de interação insuficiente e acoplamento da UI ao formato JDM. |
| Criar editor ReactFlow separado para o SuperApp | Duplica editor, gestos, testes e bugs; faz o domínio escolher a biblioteca de canvas. |
| Persistir X/Y | Layout deixa de ser determinístico e diffs passam a registrar ruído visual. |
| Colocar React em `@plataforma/core` | Mistura protocolo/core com runtime visual e cria direção de dependência inadequada. |
| Reescrever todas as views do Estaleiro agora | Viola a implementação incremental; só extraímos por prioridade ou segundo consumidor. |
