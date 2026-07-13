# Despacho de modelos fortes — extração de julgamento

> Diagnóstico inicial: 2026-07-12. Estados de task envelhecem; confirme sempre em
> `tasks/INDEX.md` e na própria spec antes do despacho.

## Princípio

O projeto já tem um manual operacional maduro (`CLAUDE.md`), skills de ciclo completo e gates
determinísticos. O melhor uso de Fable não é reescrever tudo nem executar plumbing comum. É pagar
por julgamento uma vez e persistir o resultado em um dos formatos que modelos menores consomem:

- ADR/PoC para uma decisão ainda genuinamente aberta;
- spec reendurecida para fixar o contrato;
- `wargame-task` para fixar a rota e as bifurcações de uma task pronta;
- regra/skill/pitfall para impedir recorrência sistêmica.

Não peça cadeia de pensamento. Peça decisão, evidência, procedimento reproduzível, red-team e
limites explícitos.

## Gargalos encontrados

### 1. Abstração de storage incompleta (`T-1043`) — prioridade crítica

`T-1043` está `in_progress` desde 2026-07-08. O handoff anterior já provou que consultas como
`MAX(hlc)`, `WHERE hlc > ?` e joins de membership não cabem na `GraphStorePort` atual. Isso não é
uma migração mecânica de 86 consultas: é uma decisão sobre a semântica mínima da porta, consultas
derivadas e fronteira entre graph store e projeções.

Não despachar outro executor enquanto a task estiver ativa. Se o worker atual pausar, usar Fable
para uma recuperação arquitetural: mapa completo das consultas, taxonomia por semântica, extensão
mínima da porta, impacto nos adapters e suíte de conformidade. O entregável deve ser a própria
`T-1043` reendurecida ou uma ADR curta; só depois um Sonnet executa.

### 2. Fundação Automerge nominal, não real (`T-403 → T-602 → T-603`)

`T-403` está `ready`, mas seu contrato não fixa pacote/versão nem APIs de Automerge Repo e descreve
um broadcast em RAM sobre `NetworkAdapterPort`. `T-602` e `T-603` estão em
`draft:pending_decision` porque dependem exatamente do documento vivo, do canal efêmero e do local
arquitetural que `T-403` deveria tornar reais.

Executar `T-403` como escrita hoje corre o risco de produzir um wrapper chamado Automerge sem
Automerge e cristalizar decisões erradas nas duas tasks seguintes. Este cluster merece uma única
missão Fable de recon + reendurecimento, antes de qualquer worker.

### 3. Verdade do lifecycle diverge dos artefatos

- `T-1040` está `ready`, embora a própria spec diga que o spike foi executado e a ADR-004 exista;
  a task ainda contém seções-template duplicadas e pede ratificação.
- `T-313` está `ready`, embora o corpo diga “DECOMPOSTA — não executar diretamente”.
- `_panel_temp.txt` lista 12 decisões antigas; o `INDEX.md` vivo mostra duas.

Isso degrada o roteamento: um modelo caro pode refazer trabalho concluído e um worker pode executar
uma casca. Não é trabalho de Fable. É uma auditoria mecânica do lifecycle e correção pelo serviço
MGTIA, seguida da remoção ou regeneração automática de snapshots manuais.

### 4. Specs `ready` com contrato contraditório (`T-IA-01`)

`T-IA-01` está `ready`/`haiku`, mas `packages/vector-index` ainda não existe, a seção 6 ainda a
declara draft, o título promete sqlite-vec/WASM enquanto o escopo exclui WASM real, e o contrato
injeta `StoragePort` sem fixar a capacidade de embedding citada no objetivo. Precisa de
reendurecimento, não de wargame nem execução barata.

### 5. Gates verdes em estado contaminado

`EST-33` mostrou duas classes recorrentes: código testado mas não commitado e E2E que passava por
encontrar um build antigo no worktree. O gate pós-merge em checkout limpo encontrou o defeito.
Há evidência semelhante em outras tasks. O aprendizado já está detalhado em `EST-33`; o próximo
passo é transformar a regra em guard determinístico de `finish`/integração, não pedir nova análise
aberta ao Fable.

### 6. Backlog largo sem caminho crítico executável para P0

O plano de aplicação contém cerca de 96 tasks e dez fundações P0. O superapp já implementou a base
de protocolo/core/transport e grande parte do Estaleiro, mas ainda não possui pacotes previstos
como `pages`, `workflow` e `vector-index`. Há várias raízes `ready` (`T-PG-01`, `T-WF-01`,
`T-DS-01`), porém falta uma fila topológica curta que maximize a demonstração P0 ponta a ponta.
Definir esse caminho crítico vale mais que otimizar tasks isoladas.

## Fila recomendada para Fable

### Missão F1 — auditar e fixar o cluster Automerge (agora)

**Done:** `T-403`, `T-602` e `T-603` ficam mutuamente coerentes, com dependência real, APIs e
pacotes fixados; cada decisão é citada de fonte/código; tasks ficam no substatus correto. Nenhum
código de produto é implementado.

```text
Atue como arquiteto de protocolo e faça recon read-only do cluster T-403 → T-602 → T-603 no repo
Docs e no superapp. Não execute as tasks. Prove se T-403 integra Automerge Repo de verdade ou apenas
renomeia um broadcast em RAM. Fixe pacote e versão, APIs concretas, ownership do documento vivo,
fronteira de camadas, lifecycle/TTL e como o canal efêmero alimenta o commit cycle. Depois ataque
o desenho com concorrência, reconexão, expiração durante commit e coassinatura parcial. Entregue:
(1) fatos observados com paths; (2) decisões e alternativas rejeitadas; (3) contratos TS exatos;
(4) grafo de dependências corrigido; (5) patches nas specs via fluxo MGTIA; (6) perguntas humanas
somente onde nenhuma fonte resolve. Não implemente código. Pare se precisar inventar uma API.
```

### Missão F2 — recuperar `T-1043` (quando o worker atual pausar)

**Done:** existe uma fronteira de storage executável e uma matriz das 86 ocorrências para métodos
da porta, projeções ou exceções justificadas, com testes de conformidade e abort conditions.

```text
Faça uma recuperação arquitetural da T-1043, sem editar código enquanto houver outro worker ativo.
Leia a ADR-005, GraphStorePort real, os oito arquivos e cada consulta SQL remanescente. Classifique
cada consulta por semântica (lookup, range temporal, agregação, join/projeção, transação). Derive a
menor extensão da porta que preserva agnosticismo sem criar uma SQL API disfarçada. Para cada método
novo, fixe assinatura, invariantes, complexidade esperada e teste de conformidade comum a SQLite e
KV. Red-team: sync sob partição, ordenação HLC, atomicidade e performance. Entregue ADR ou T-1043
reendurecida, mapa consulta→método e plano executável por Sonnet. Não faça a migração.
```

### Missão F3 — escolher o menor caminho crítico até a demonstração P0

**Done:** uma sequência topológica curta termina na validação canônica de P0, identifica o que
paraleliza, o que deve parar e os gates de marco. A lista deve usar o estado real, não o plano ideal.

```text
Audite Docs + superapp e derive o menor caminho crítico do estado atual até a validação P0 de
docs/plano-aplicacao.md: uma SPEC:PAGE renderizada no shell, dados por projeção, ação por intent e
workflow Nível 1, sem código ad hoc. Reconstrua o grafo a partir das tasks e do código existente.
Entregue: (1) capacidades já reais; (2) lacunas e specs falsamente ready; (3) sequência topológica
mínima com gates por marco; (4) até três frentes paralelas de arquivos disjuntos; (5) tasks a adiar
explicitamente; (6) riscos e critérios de aborto. Red-team o caminho com uma integração ponta a
ponta e uma falha de dependência. Não implemente nem reescreva todo o backlog.
```

### Missão F4 — wargame de `T-705` (depois de F1/F2, ou em slot livre)

`T-705` é `ready`, `sonnet` e cruza Noise, HKDF/SAS, UCAN, KeyVault, storage, rede e Playwright.
É o melhor candidato atual para `/wargame-task T-705`. O Fable deve apenas gravar a seção 5b; um
Sonnet executa depois. O recon precisa confirmar especialmente o formato de `handshakeHash`, a
conversão sem viés para seis dígitos, destruição de chave efêmera, replay/TTL e atomicidade entre
permissão, delegação e bump de época.

## Não gastar Fable agora

- `T-1040`: spike já executado; ratificar/fechar mecanicamente.
- `T-313`: pai decomposto; trabalhar apenas nas filhas/status, sem novo wargame do pai.
- `T-DS-05`: exige sobretudo julgamento visual, previews e contraste; usar especialista de design
  e acessibilidade, não Fable como primeira escolha.
- `T-1044`, `L-03`, `T-701b`: bloqueios já explicados por dependência ou task órfã; resolver lifecycle
  e arquitetura primeiro.
- Cleanups `C-20..C-29` e implementações lineares: modelos baratos depois de specs corretas.

## Protocolo de extração por missão

Toda missão forte termina com:

1. artefato canônico atualizado (ADR, spec ou seção 5b);
2. fatos separados de inferências;
3. um ataque resistido e um ataque que provocou correção;
4. comando/gate que um modelo menor executará;
5. `extract-approach` para promover apenas o aprendizado recorrente que ainda não esteja capturado.
