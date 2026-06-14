# RFC-014 — Contábil, Fiscal e RH
> **Status:** Proposta
> **Precedência:** complementa a RFC-013 (os fatos operacionais de lá são a fonte daqui); depende fortemente da RFC-009 (jurisdição + vigência por competência) e da RFC-007 (conectores classe C para NF-e/SPED/eSocial). **Zero tipo de nó novo.** Onde não tocada, a doc vigente prevalece.
> **Transversais posteriores a aplicar na absorção:** fechamento de período, apuração e processo de folha são `SPEC:WORKFLOW` (RFC-022, com tarefa humana via `APPROVED_BY`); o contador é profile externo escopado e o módulo segue o plano de comando/compartimentação (RFC-027); telas de razão/folha usam `DataTable` no shell (RFC-026).
> **Tese:** contabilidade, fiscal e folha **não são dados paralelos** — são **lançamentos e apurações derivados** dos fatos econômicos já no grafo, por SPEC. O que muda por região é dado jurisdicional (RFC-009), não código. A plataforma orquestra, provisiona e audita; o **cálculo oficial e a transmissão** são delegados a conector — a plataforma não substitui o contador nem o fisco.

## A.1 — Contabilidade como derivação por SPEC

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/15-contabil-fiscal-rh-reference-spec.md` | novo | Documento canônico, §1 |
| `docs/conceitos/lancamento-derivado.md` | novo verbete | fato econômico → lançamento contábil por SPEC |

**Texto normativo:**

1. Um lançamento contábil é a **projeção contábil de um fato econômico** já existente (uma venda, uma baixa, uma folha). A `SPEC` contábil mapeia cada tipo de fato → débito/crédito em contas, via Zen. A partida dobrada já é nativa (RFC-012 A.5.1: um `SPENDS`, N `CREDITS`); a contabilidade apenas **classifica** esses movimentos em contas.
2. Não há "lançar de novo" o que já aconteceu: o razão é **derivado e reconstruível** da linhagem dos fatos. Correção = novo fato/estorno append-only, nunca edição.
3. O razão/balancete são projeções; o fechamento contábil "congela" um período declarando-o fechado (A.6), não apagando nada.

## A.2 — Plano de contas e classificação

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/15-contabil-fiscal-rh-reference-spec.md` | §2 | Adicionar |

**Texto normativo:**

1. **Plano de contas** = `SPECIFICATION` (estrutura hierárquica de contas), versionado por linhagem. Pode ser jurisdicional (RFC-009): a variante regional fornece o plano referencial e as regras de classificação.
2. A regra "fato X → conta débito/conta crédito" é **Zen na SPEC contábil**, parametrizável por jurisdição e por política contábil da empresa. Mudança de regra = `SUPERSEDED_BY` com vigência (RFC-009 A.3).
3. Multi-empresa/multi-filial: cada entidade contábil é escopo de `PROFILE:ORGANIZATION`; consolidação é traversal sobre as entidades.

## A.3 — Fiscal: apuração, provisão e emissão

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/15-contabil-fiscal-rh-reference-spec.md` | §3 | Adicionar |

**Texto normativo:**

1. **Apuração de tributos** é Zen jurisdicional sobre os fatos, aplicando a regra **vigente na competência** (RFC-009 A.3) — recálculo retroativo correto por construção. O **imposto a recolher** acumula em `ASSET:BALANCE_STATE` próprio (RFC-012 A.5.2).
2. **Emissão e validação de documentos fiscais** (NF-e, NFS-e, etc.) são **delegadas a conector** (RFC-007 classe C — oráculo). A variante jurisdicional decide *qual* conector e parâmetros (RFC-009 A.4). A plataforma modela o que precisa para orquestrar e provisionar; **não reimplementa o motor fiscal externo**.
3. **SPED / obrigações acessórias** (escrituração fiscal/contábil digital): geração do arquivo é projeção sobre os fatos; transmissão é conector. Falta de conector → modo degradado declarado (registra o dever, não transmite), nunca finge conformidade.

## A.4 — Preparação para a contabilidade do cliente

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/15-contabil-fiscal-rh-reference-spec.md` | §4 | Adicionar |
| `docs/conceitos/acesso-contador.md` | novo verbete | persona externa escopada |

**Texto normativo:**

1. O **contador é uma persona externa** (`PROFILE`) com `ASSET:ROLE` escopado, que **lê o subgrafo do cliente** pela lente contábil/fiscal — não recebe export manual. Permissão O(1) pelo mesmo mecanismo de qualquer ROLE; revogável.
2. **Exportações formais** (ECD, ECF, SPED Fiscal/Contribuições, balancete, razão) são projeções geradas sob demanda, com a data de geração e a competência registradas; quando há transmissão oficial, via conector.
3. **Fechamento de período** declara a competência fechada: novos fatos com data nessa competência exigem reabertura explícita (intent auditável) ou vão para período aberto seguinte — disciplina contábil sem mutar o passado.

## A.5 — RH e folha

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/15-contabil-fiscal-rh-reference-spec.md` | §5 | Adicionar |
| `docs/conceitos/folha-derivada.md` | novo verbete | folha = lançamentos derivados de eventos de trabalho |

**Texto normativo:**

1. **Colaborador** = `PROFILE`; **vínculo/contrato** = `ASSET:ROLE` (papel com escopo, início/fim) + `CONTENT` do contrato. Cargos/estruturas = SPEC.
2. **Eventos de trabalho** (admissão, ponto, hora extra, afastamento, férias, desligamento) = `CONTENT` governado por SPEC; são a **fonte** da folha.
3. **Folha = lançamentos derivados** dos eventos de trabalho (invariante base universal — RFC-009 A.2.1). A variante jurisdicional carrega os encargos (no BR: INSS, FGTS, IRRF, etc.) com **vigência por competência**; recalcular uma competência anterior aplica a regra da época (RFC-009 A.3). A folha apurada gera provisão (`BALANCE_STATE`) e lançamentos contábeis (A.1).
4. **Obrigações de RH** (no BR: eSocial e afins) são transmitidas por **conector** (RFC-007 C); a plataforma apura e provisiona, o conector transmite.
5. Benefícios, ponto eletrônico, avaliações e treinamentos modelam-se como `CONTENT`/`ASSET` sobre o mesmo colaborador — RH é uma lente, não um silo.
6. **Dado pessoal de colaborador e direitos do titular.** Dados pessoais de colaborador e eventos de trabalho são tratados sob o framework de privacidade canônico [[03-legal-and-compliance-framework]]: consentimento de primeira classe (`ASSET:CONSENT` §2.1), portabilidade/exclusão por `CONTENT:INTENT` (§2.2–2.3) e **retenção legal prevalecente** (§2.3) sobre folha/encargos sujeitos a obrigação trabalhista/fiscal — que não são passíveis de expurgo enquanto vigente a retenção.

## A.6 — Fechamento, auditoria e reabertura

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/15-contabil-fiscal-rh-reference-spec.md` | §6 | Adicionar |

**Texto normativo:**

1. Trilha de auditoria é a **própria linhagem** (`AuditTrail` engine): quem lançou, quando, sob qual versão de regra — sem log paralelo falsificável.
2. **Recálculo retroativo** (folha, tributo, custo) navega a linhagem e a vigência (RFC-009 A.3); o resultado é um novo fato derivado, com a competência e a versão de regra marcadas. Recálculos retroativos massivos (reclassificação de competência inteira após nova versão de regra) **não executam síncronos no dispositivo**: são despachados à **fila de computação assíncrona** (RFC-010) em background, preservando a responsividade local-first; o resultado é materializado como novos fatos derivados com competência e versão de regra marcadas.
3. Reabertura de período fechado é intent explícito e auditável; o histórico de fechamentos/reaberturas é, ele mesmo, linhagem.

## A.7 — Limites honestos

1. A plataforma **não é a autoridade fiscal/contábil oficial**: o cálculo legal definitivo e a transmissão dependem de conector e do profissional habilitado. Sem conector, opera em modo degradado declarado.
2. Apuração depende da completude dos fatos no grafo; lacuna de sync ou fato não registrado = apuração incompleta, sinalizada, não estimada silenciosamente.
3. Regras jurisdicionais ausentes (país sem variante publicada) degradam para a base com fato negativo (RFC-009 A.2.3) — nunca aplica regra de outra jurisdição.
4. **Prazo legal × sincronização:** obrigações fiscais/trabalhistas têm prazos duros, mas a apuração depende de a linhagem estar sincronizada e o conector disponível. Atraso de sync ou indisponibilidade de conector na janela do prazo é **risco operacional real** — a plataforma sinaliza a pendência com antecedência, mas não pode garantir transmissão se o insumo não chegou a tempo.
5. **Erro de classificação propaga:** como o razão é derivado por SPEC (mapeamento fato→conta), uma regra de classificação incorreta contamina todos os lançamentos derivados até ser corrigida (por nova versão + recálculo). A derivação é auditável e reproduzível, mas não imune a regra mal especificada — daí a necessidade de revisão profissional.
6. **Defasagem regulatória:** variantes jurisdicionais refletem a lei *publicada como SPEC*; entre a mudança da lei e a publicação da variante há janela em que a regra vigente pode estar desatualizada — mitigada por vigência por competência (recálculo retroativo, RFC-009 A.3), não eliminada.

## A.8 — Preparativos no plano

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-CFR-01..05 |

**T-CFR-01** plano de contas como SPEC + mapeamento fato→conta por Zen jurisdicional (DoD Protocolo/core); **T-CFR-02** apuração fiscal por competência com vigência (RFC-009) + provisão em `BALANCE_STATE` + geração de arquivo SPED como projeção; **T-CFR-03** persona contador (`ASSET:ROLE` escopado lendo subgrafo do cliente) + exportações formais; **T-CFR-04** RH: colaborador/vínculo/eventos + folha derivada jurisdicional + provisão e lançamentos; **T-CFR-05** vetores adversariais (§0.1.7): recálculo retroativo aplicando regra da época, fechamento impedindo mutação do passado, jurisdição ausente degradando sem aplicar regra alheia, conector fiscal ausente → modo degradado declarado.
