# 11-linguagem-de-paginas.md — Linguagem de Páginas (UI Spec-Based)

> Fonte: RFC-008 (absorvida e deletada). Estende caderno-3/03 §3 (ui_hints) e RFC-006 (catálogo, tokens, metadados). Pré-requisito de todas as RFCs de produto (011+).

---

## §1 — Página como Nó do Grafo

1. Uma página é um nó **`SPECIFICATION` (kind: `PAGE`)** cujo payload é um documento do dialeto desta RFC. Herda de graça: [[linhagem-de-versoes]] (versionar/reverter/auditar), assinatura do autor, governança (`GOVERNED_BY`, validadores), distribuição por replicação normal do grafo.
2. **Customização = `EXTENDS`:** o módulo canônico publica a página base; org/usuário publica `SPEC:PAGE` que a estende com overrides declarativos (substituir/ocultar/inserir nós da árvore por id estável). Resolução de qual variante renderizar segue descoberta por grafo (mesmo padrão que RFC-009 usará para jurisdição). Nenhuma recompilação ou deploy.
3. **Dogfooding obrigatório:** módulos canônicos (RFCs 011+) são autorados nesta linguagem. Código compilado só existe em: catálogo de componentes (RFC-006), engines, renderizador. Se um módulo canônico "precisa" sair da linguagem, isso denuncia componente/slot faltante no catálogo — segue o fluxo de autoria RFC-006 A.3.
4. `dialect_version` no payload; renderizador rejeita versões que não reconhece (mesma postura da quarentena de wire protocol).

---

## §2 — O Documento: Árvore Restrita ao Catálogo

```jsonc
{
  "dialect_version": "1.0",
  "page": { "id": "...", "title_key": "...", "route": "/..." },
  "sources": { /* A.3 — fontes de dados nomeadas */ },
  "state":   { /* A.3 — estado local tipado, com defaults */ },
  "tree": {
    "id": "root",                    // id estável (alvo de EXTENDS)
    "component": "Card",             // OBRIGATÓRIO: nome do catálogo RFC-006
    "props": { "title": { "$bind": "sources.cliente.nome" } },
    "visible": { "$zen": "state.aba == 'resumo'" },
    "children": [ /* recursivo */ ],
    "actions": { /* A.5 */ }
  },
  "forms": { /* A.6 */ },
  "limits_profile": "default"
}
```

Invariantes (validados estática e dinamicamente):

- **L1:** `component` só referencia nomes do catálogo; `props` validadas contra o schema de metadados do componente (RFC-006 A.3). Componente desconhecido/prop inválida → página inválida, não render parcial silencioso.
- **L2:** nenhum HTML, CSS, JS ou URL de script no documento. Estilo só por variantes/tokens expostos como props pelo componente (regra de ouro RFC-006 A.4).
- **L3 — limites de recurso por perfil declarado:** profundidade máx. da árvore, contagem máx. de nós, tamanho máx. de expressão ZEN, orçamento de avaliação por ciclo de render, tamanho máx. do documento. Valores são dados de `SPECIFICATION` da plataforma (limites dinâmicos, nunca números fixos em código — princípio P da V3.0). O avaliador ZEN deve ser interrompível sob o orçamento L3 sem bloquear a main thread (ex.: execução em worker), garantindo abort observável quando o orçamento de avaliação por ciclo de render estoura.
- **L4:** ids de nós da árvore são estáveis e únicos no documento (pré-condição do override por `EXTENDS`).

---

## §3 — Dados: Fontes Declaradas, Expressões ZEN Puras

1. **Fontes (`sources`)** são as únicas entradas de dados: queries nomeadas sobre projeções/TinyBase (parametrizáveis por rota/estado), parâmetros de rota, contexto da sessão (persona, tema, locale, jurisdição). A página **declara** a fonte; o runtime resolve, assina reatividade (TinyBase) e re-renderiza. Não existe `fetch`, acesso a storage, nem chamada de conector a partir da página.
2. **Permissão na fonte, não na página:** a query roda com as capacidades do *usuário logado* — a página não eleva privilégio. Campo sem chave → mesmo comportamento de qualquer UI ([[predicado-de-bloqueio]], placeholders cifrados).
3. **ZEN é a única linguagem de expressão** (`$zen`): derivação, formatação, visibilidade condicional, validação de formulário. Total e terminante por construção, sem I/O, avaliada sob o orçamento L3. Mesmo vocabulário das regras de negócio nas SPECs — um motor só, doutrina confirmada.
4. `$bind` é açúcar para a expressão identidade sobre uma fonte; tudo que `$bind` faz, `$zen` faz.
5. **`state` da página × sessão-doc (RFC-027 A.4) são camadas distintas.** O `state` (A.2) é **estado transiente de render** — seleção, aba ativa, rascunho de campo — local àquela montagem da página, descartável, nunca replicado. A **sessão-doc colaborativa** é a camada *durável-capaz* (Automerge, efêmera por padrão, persistir/compartilhar é opt-in) usada **só onde a seção é editorial** (compor, configurar, IA-assistir). Regra: o que é UI-volátil fica em `state`; o que é o **conteúdo sendo editado** vai para a sessão-doc. Página de leitura pura não tem sessão-doc — só `state` + fontes.
6. Componente que opera sobre uma **sessão-doc** (A.3.5) recebe a sub-árvore CRDT como fonte reativa do mesmo modo que `sources`: o runtime assina as mutations do Automerge e re-renderiza pela mesma via que TinyBase. A página não acessa o CRDT diretamente — declara a fonte editorial e o runtime unifica a reatividade.

---

## §4 — Lógica Complexa Mora no Catálogo, Não na Página

1. O catálogo admite **componentes ricos**: componentes com lógica JS interna complexa e padronizada (planilha com motor de fórmulas, player de vídeo, editor rich-text, gráficos, mapa embutido). Essa lógica é código de plataforma — auditada, versionada e distribuída com o app pelo fluxo de autoria RFC-006 A.3, **jamais** transportada no documento de página.
2. Componente rico expõe **pontos de customização ZEN** declarados em seus metadados (ex.: planilha aceita funções de fórmula custom em ZEN; player aceita regra ZEN de skip/anotação; gráfico aceita transformação ZEN da série). A página customiza comportamento **dentro do envelope que o componente declarou** — nunca além.
3. Critério de admissão de componente rico: a lógica é genérica e reutilizável entre módulos? Sim → catálogo. É regra de negócio de um fluxo? → ZEN na SPEC do fluxo. É visual? → tokens/variantes.
4. Componente rico deve ser carregado sob demanda (code-splitting / `React.lazy` ou equivalente): o catálogo distribui seu código de plataforma, mas o renderizador o resolve apenas quando uma página o referencia, mantendo enxuto o bundle inicial do renderizador.

---

## §5 — Ações: O Teto de Abuso

O vocabulário de ações é fechado e taxativo:

| Ação | Efeito |
| :--- | :--- |
| `intent` | Emite `CONTENT:INTENT` (payload montado por ZEN sobre fontes/estado/form) que entra no **pipeline normal** de permissões e validadores |
| `navigate` | Navegação declarativa para rota/`SPEC:PAGE` |
| `set_state` | Mutação do estado local tipado da página |
| `open_form` / `submit_form` | Ciclo do A.6 |

Consequência central: **uma página não consegue fazer nada que seu usuário não pudesse fazer sem ela.** O intent é assinado pela persona do usuário e validado como qualquer outro; página maliciosa no máximo *propõe* operações que o pipeline rejeita. Não há ação de rede, de conector, de storage, nem de execução.

---

## §6 — Formulários (Padrão JSON Forms)

1. Sub-dialeto de formulário no padrão JSON Forms: **dataschema + uischema separados**. O dataschema **é a própria `SPECIFICATION` do nó alvo** (schema de payload já existente) — formulários nunca redefinem a forma dos dados; referenciam-na.
2. O uischema (layout de campos, agrupamento, ordem, widgets por campo) é parte do documento de página, usando componentes de formulário do catálogo.
3. Validação em duas camadas: estrutural pelo dataschema (tipos, obrigatoriedade) + regras ZEN da SPEC (as mesmas que o validador aplicará). O formulário antecipa no cliente exatamente o que o pipeline verificará — nunca regras divergentes.
4. `submit_form` = `intent` de criação/mutação do nó alvo. Sem endpoint próprio, sem handler custom.

---

## §7 — Validação, Confiança e Geração por IA

1. **Validador estático** (schema do dialeto + catálogo + L1–L4) roda: na autoria (antes de publicar o nó), na ingestão (peer que recebe `SPEC:PAGE` replicado) e no render. Página inválida não renderiza — exibe fallback com diagnóstico.
2. **Confiança gradual:** renderizar uma página é seguro por construção (A.5), então páginas de terceiros são renderizáveis; a UI sinaliza autor/assinatura fora do círculo de confiança do usuário (mesma lógica social de qualquer CONTENT).
3. **Geração por IA** (RFC-010): o agente produz documentos deste dialeto guiado pelos metadados do catálogo (`AIHints`, `Props`, `AntiPatterns` — RFC-006 A.3 foi desenhada para isso) e publica via intent sujeito ao mesmo validador. O renderizador suporta **render progressivo por streaming** (árvore parcial válida renderiza incrementalmente) para a experiência de geração ao vivo.
4. **Fim de vida (arquivamento):** arquivar uma `SPEC:PAGE` a remove da navegação sem afetar dados — as respostas de formulários (A.6) já são nós alvo independentes, governados por suas próprias `SPECIFICATION`/data schemas, e permanecem pelo ciclo de vida normal do grafo. A página é uma view sobre os dados, não sua dona.

---

## §8 — Perfis de Capacidade do Motor (Emenda RFC-025)

1. O motor de páginas é **único**; cada caso de uso é um **perfil de capacidade**: um subset de componentes permitidos + comportamento (linear vs. livre) + ações habilitadas. Perfis previstos: `pagina_completa` (tudo), `documento` (linear, subset Notion/Obsidian), `anuncio` (criativo + componentes), `slide` (apresentação), `comentario_post` (markdown simples). Ver [[perfil-de-capacidade]].
2. O perfil é declarado na `SPEC:PAGE`; o validador aplica o subset do perfil. Trocar de perfil é restringir/relaxar, nunca trocar de motor.
3. Isso unifica páginas, artigos, docs Notion, anúncios e apresentações sob um motor — com WYSIWYG e autoria apontar-e-descrever (estilo Layrr) editando o mesmo `SPEC:PAGE`.
