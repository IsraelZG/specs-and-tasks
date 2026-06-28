# 13-jurisdicao.md — Jurisdição e Regionalização de Regras

> Fonte: RFC-009 (absorvida e deletada). Estende caderno-3/04 (i18n de strings) com o análogo para **regras**. Pré-requisito de RFC-012 (Marketplace+Fintech) e RFC-013 (ERP/CRM). Princípio: assim como um componente resolve uma string pela *locale*, um validador resolve uma regra pela *jurisdição*.

---

## §1 — Jurisdição como Dimensão de Resolução

1. **Jurisdição** é uma dimensão de contexto (como `locale`, `theme`, `density`) que seleciona *qual variante de regra* um validador aplica. É um identificador hierárquico (`BR`, `BR-SP`, `US`, `US-CA`, `EU`, …) — regiões mais específicas herdam e sobrepõem as mais gerais.
2. **Resolução por grafo:** a jurisdição efetiva de uma operação resolve-se por precedência: jurisdição declarada na operação (override explícito) → jurisdição do `PROFILE:ORGANIZATION`/contexto do nó → jurisdição default da implementação. Sem ambiguidade silenciosa: a jurisdição resolvida é registrada no fato.
3. **Spec-driven, não código:** nenhum módulo embute lógica regional. O que varia por região é **dado** (tabelas, alíquotas, procedimentos Zen) carregado por SPEC — exatamente como strings traduzidas são dados, não código.

---

## §2 — SPEC Base + Variantes por `EXTENDS`

1. A **SPEC base** declara os **invariantes universais** do domínio — a forma que não muda entre regiões (ex.: "folha = lançamentos derivados de eventos de trabalho"; "nota fiscal referencia itens e um destinatário"). A base é a fonte da verdade estrutural.
2. **Variantes jurisdicionais** estendem a base via aresta `EXTENDS`, carregando as tabelas e procedimentos Zen daquela região (ex.: `SPEC:FOLHA@BR` adiciona INSS/FGTS/IRRF; `SPEC:FOLHA@US` adiciona federal/state withholding). A variante **só pode especializar**, nunca contradizer os invariantes da base — validado na ingestão.
3. **Resolução em cascata:** o validador, dada a jurisdição efetiva (A.1.2), aplica a variante mais específica disponível compondo sobre a base; ausência de variante para a região → degrada para a base com `fato-negativo-verificável` ("regra regional ausente"), nunca aplica regra de outra região por engano.
4. **Internacionalização = adicionar variantes**, sem tocar a base nem o módulo. Abrir operação num novo país é publicar `SPEC:*@<jurisdição>` — mesma facilidade de adicionar um `CONTENT:TRANSLATION`.

---

## §3 — Vigência Temporal: a Competência Manda

1. Toda SPEC jurisdicional carrega **janela de vigência** no payload (`vigente_de`, `vigente_ate`). A regra aplicável a uma operação é a vigente **na competência do fato** (mês de referência da folha, data do fato gerador do imposto), **não** na data em que o cálculo é executado.
2. **Recálculo retroativo** (recalcular folha de março em junho; refazer apuração de competência anterior) navega a [[linhagem-de-versoes]] e aplica a versão da SPEC vigente naquela competência — comportamento correto por construção, sem snapshots manuais de "como era a lei".
3. **Mudança de lei = `SUPERSEDED_BY`** com nova janela de vigência; o histórico permanece auditável e a apuração de qualquer período passado é reproduzível. Nenhuma reescrita destrutiva de regra.
4. Conflito de vigências sobrepostas para a mesma jurisdição+competência é erro de autoria, detectado na ingestão da variante.

---

## §4 — Escopo de Aplicação e Fronteira com Conectores

1. A regionalização cobre: cálculos e validações de negócio (alíquotas, limites legais, regras de elegibilidade), formatos e máscaras (documento de identidade, conta bancária), e **roteamento de conector** (a variante jurisdicional pode declarar *qual* `connector_id` usar — NF-e brasileira vs. equivalente de outro país — fechando o elo com RFC-007 A.2.4).
2. A plataforma **não reimplementa o motor legal externo**: emissão/validação fiscal continua delegada a conector (RFC-007 classe C). A variante jurisdicional decide *que* conector e *com que parâmetros*; o conector externo é a autoridade sobre o cálculo oficial. A regra própria cobre o que a plataforma precisa saber para orquestrar e auditar (ex.: provisionar o imposto a recolher como `ASSET:BALANCE_STATE`), não para *substituir* o fisco.
3. Limite honesto: jurisdições sem conector disponível operam em modo degradado declarado (registro do dever fiscal sem emissão automática), nunca fingindo conformidade.

---

## §5 — Operação que Cruza Jurisdições

1. **Não existe "a" jurisdição da operação — existe a jurisdição por papel.** Cada aspecto regulado tem uma âncora declarada na SPEC: tributo de origem segue a jurisdição do **vendedor/estabelecimento**; tributo de destino/consumo segue a do **comprador/entrega**; regra trabalhista segue a do **local de prestação**; proteção de dados segue a do **titular**. A operação resolve **cada regra com a âncora que lhe corresponde**, não uma jurisdição única para tudo.
2. **Composição, não disputa:** uma venda BR→US apura imposto de saída pela variante `@BR` e imposto de entrada pela `@US`, ambos provisionados em `BALANCE_STATE` próprios (RFC-013 A.5.2) — as duas variantes coexistem na mesma operação, cada uma no seu papel. Conflito real (duas regras reivindicam o mesmo papel) é erro de modelagem da SPEC, detectado na validação.
3. **Conectores por jurisdição:** cada âncora pode rotear um conector distinto (NF-e de saída no BR; sales-tax/3rd-party fiscal no US) — RFC-007 A.2.4 / A.4 desta RFC. Ausência de conector para qualquer âncora → modo degradado **só naquele papel**, declarado, sem contaminar os demais.
4. A jurisdição efetiva de cada papel é registrada no fato (A.1.2), tornando a apuração multi-jurisdição auditável e reproduzível por competência (A.3).
5. **Âncora `Merchant of Record` (MoR)**: Além das âncoras de papel tradicionais (origem, destino, prestação, titular), define-se a âncora `Merchant of Record` (MoR) para regular o intermediário legal encarregado da liquidação financeira e das obrigações fiscais perante adquirentes e bandeiras. O MoR é modelado explicitamente como um papel jurisdicional na SPEC de negociação.
6. **Bloqueio Rígido Legal (Hard Stop) vs. Degradação com Alerta**: Em cenários de compliance estrito (ex: emissão de Nota Fiscal no Brasil para expedição física), a SPEC jurisdicional pode declarar um passo de validação como `blocking: true` (Hard Stop). Caso o conector fiscal falhe, a transição do workflow é bloqueada por padrão para evitar infração fiscal. Lojistas operando manualmente podem forçar um override para contornar o bloqueio temporariamente, o que dispara um aviso em Vermelho Escuro na UI alertando sobre a infração e registra o fato no audit trail para fins de responsabilidade.
