# Relatório de Consistência das RFCs

> **Data:** 2026-06-14
> **RFCs auditadas:** 22 (rfc-006 a rfc-027) + 2 docs de ordenação (`ordem-de-absorcao.md`, `plano-de-modulos.md`); cruzadas com `docs/conceitos/`, `docs/caderno-*/` e os reviews em `docs/rfc_reviews/`.
> **Premissa:** RFCs estão em **Proposta** — carregam texto normativo ainda não absorvido. Não se acusa falta de wikilink nem "redefinição de conceito" (esperado nesta fase). Auditam-se contradições, ordem, refs quebradas e lacunas.

## Contagem por severidade
- **Alta:** 4
- **Média:** 5
- **Baixa:** 3
- **Total:** 12

## Suspeitas verificadas e **rebaixadas** (não são contradição)
- **ZEN/orçamento (rfc-008) × cascata de fórmulas de planilha (rfc-025):** não há conflito. RFC-008 A.4.1 coloca o motor de fórmulas da planilha como **JS de componente rico** (código de plataforma), e os "pontos de customização ZEN" (A.4.2) ficam dentro do envelope do componente. RFC-025 A.3.1 reafirma exatamente isso ("motor de fórmulas real + pontos ZEN"). O orçamento L3 da página não rege as fórmulas internas do componente. **Coerente.**
- **SDK embutido × plugin infra para LiveKit (rfc-010 × rfc-017/018):** as três dizem o mesmo — SDK cliente **embutido** (first-party) + SFU como **plugin `infra`** exigido pelo LiveKit, modality-gated, P2P puro degrada para WebRTC bruto (RFC-010 A.3.3; RFC-017 A.3.1; RFC-018 A.3.1). **Coerente.**
- **E2E de grupo (rfc-018) × trilha de auditoria/LGPD (rfc-013):** sem contradição. Gravação em RFC-018 é opt-in/consentida; `AuditTrail` (RFC-013) lê a **linhagem**, não fura E2E. (Há, porém, um gap distinto — ver L-04.)
- **LGPD/crypto-shredding como lacuna de protocolo (rfc-013):** **não é lacuna no protocolo** — está canônico em `caderno-1-vision/03-legal-and-compliance-framework.md` §2–3 (asset-consent, rotação de épocas, expurgo, retenção legal prevalecente). O gap real é de **fiação no produto** (ver L-04).
- **`[[serves]]` (rfc-010/011) "quebrado":** não está quebrado. `docs/conceitos/serves-aresta.md` declara `serves` como **alias**. **Resolve.**

## Tabela de achados

| id | tema | rfcs/arquivos envolvidos | tipo | severidade | evidência (arquivo §) | recomendação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| O-01 | Colisão de numeração de doc no caderno-3 (slot **09**) | rfc-006 + `caderno-3-sdk/09-hierarchical-theme-customization.md` | ordem-conflitante | **alta** | rfc-006 §A.1 "Onde integrar" cria `caderno-3-sdk/09-design-system.md`, mas `09-hierarchical-theme-customization.md` **já existe** (verificado por Glob; lido o cabeçalho). Toda a cadeia 006→008→010→… herda o número (10-páginas, 11-plugins, …) assumindo 09 = design-system | Decidir renumeração: ou o design-system entra como **10** e tudo desloca +1, ou o hierarchical-theme é incorporado/renumerado. Sem decisão, a absorção cria dois "09" |
| O-02 | Colisão de numeração de doc no caderno-3 (slot **22**) | rfc-021 (Mapa) × rfc-022 (Workflow) | ordem-conflitante | **alta** | rfc-021 §A.1 cria `caderno-3-sdk/22-mapa-reference-spec.md`; rfc-022 §A.1 cria `caderno-3-sdk/22-workflow-reference-spec.md` — **mesmo número 22** para docs diferentes | Atribuir números distintos. Como a colisão O-01 já desloca a sequência, fixar a numeração final de todo o caderno-3 num único mapa antes de absorver |
| O-03 | Numeração de produto divergente no cabeçalho da rfc-009 | rfc-009 × ordem-de-absorcao/plano-de-modulos | ref-quebrada | **média** | rfc-009 §cabeçalho: "Pré-requisito de **RFC-011-Marketplace+Fintech e RFC-012-ERP/CRM**". Pela numeração real (e pelos docs de ordenação), Marketplace = **rfc-012** e ERP/CRM = **rfc-013** | Corrigir para "rfc-012 (Marketplace+Fintech) e rfc-013 (ERP/CRM)" na absorção |
| O-04 | Ref. de produto errada/vaga na rfc-010 | rfc-010 | ref-quebrada | **baixa** | rfc-010 §A.6.3: "cálculo de folha (**RFC-010-consumidora**)". Folha é da **rfc-014** (Contábil/Fiscal/RH); "RFC-010-consumidora" não identifica RFC alguma | Trocar por "rfc-014 (folha)" |
| O-05 | Ref. de produto errada na rfc-012 (costura) | rfc-012 × rfc-014/rfc-015 | ref-quebrada | **média** | rfc-012 §A.9.2 rotula a costura de anúncios como "**Anúncios (RFC-014)**"; Anúncios é **rfc-015** (rfc-014 é Contábil). Os docs de apoio (`inventario`, `diff`) já usam rfc-015 corretamente | Corrigir para "Anúncios (rfc-015)" na absorção |
| L-01 | Ressurreição de deadline em P2P (timers HLC) | rfc-022 | lacuna | **alta** | rfc-022 §A.2 usa "Deadline HLC" para timers, mas não define como um timer é **recuperado se o peer orquestrador cai**. Confirmado por `review_rfc-022.md` §2 ("ressuscitar os timers... senão os timeouts podem ser perdidos") | Especificar publicação durável/distribuída do deadline (fato ou projeção replicada) e quem o assume na queda do orquestrador |
| L-02 | k-anonimato na segmentação de anúncios | rfc-015 | lacuna | **alta** | rfc-015 §A.3.2 proíbe ler plaintext restrito, mas **não impõe coorte mínimo**: campanha hiper-restrita entregue a 1 pessoa de-anonimiza o alvo. Confirmado por `review_rfc-015.md` §2.2 (recomenda k-anonymity hardcoded, coorte ≥ N) | Adicionar invariante de coorte mínimo (k-anonimato) antes de veicular; recusar veiculação abaixo de N |
| L-03 | MoR + hard-stop legal na jurisdição | rfc-009 | lacuna | **alta** | (a) §A.5 ancora regras por papel (origem/destino/prestação/titular) mas **não cobre Merchant of Record** (plataforma como intermediária fiscal). (b) §A.4.3/§A.5.3 **degradam silenciosamente** para "fato-negativo" mesmo onde o fato é **legalmente bloqueante** (ex.: sem NF-e não se expede no BR). Confirmado por `review_rfc-009.md` §2 (MoR + "Hard Stop Workflow") | Prever âncora de papel MoR e um modo **hard-stop** (predicado de bloqueio rígido) que impeça a transição quando a regra é bloqueante — distinto da degradação por fato-negativo |
| L-04 | Personal-data dos produtos não conectado às primitivas LGPD canônicas | rfc-013, rfc-014 (× caderno-1/03, [[asset-consent]]) | lacuna | **média** | rfc-013 (CRM: contatos/leads como `PROFILE`) e rfc-014 (RH: colaborador/ponto/folha) tratam dados pessoais sensíveis e **não citam** consentimento/expurgo/retenção legal. Grep por `consent\|LGPD\|titular\|expurgo` nas duas RFCs: **0 ocorrências**. O framework existe em `caderno-1-vision/03` §2–3, mas as RFCs não o referenciam | Na absorção, costurar CRM/RH a `asset-consent`, expurgo por rotação de época e retenção legal prevalecente (caderno-1/03) — sobretudo RH/folha e contatos de CRM |
| L-05 | Versionamento de instâncias de workflow in-flight | rfc-022 | lacuna | **média** | rfc-022 cobre `EXTENDS`/`SUPERSEDED_BY` da SPEC, mas **não define o que acontece com instâncias já em execução** quando a `SPEC:WORKFLOW` é superada. Confirmado por `review_rfc-022.md` §2 (sugere "instâncias terminam no modelo em que nasceram") | Declarar política: instância roda até o fim sob a versão de SPEC em que nasceu (pin de versão por instância) |
| L-06 | Escalonamento de tarefa humana travada | rfc-022 | lacuna | **baixa** | rfc-022 §A.4 prevê tarefa humana via `APPROVED_BY`, mas não trata o caso de aprovador inexistente/demitido travando a saga. `review_rfc-022.md` §2 sugere escalonamento padrão por prazo | Prever timeout/escalonamento de aprovação na SPEC do workflow |
| O-06 | Eixos de ordenação distintos podem ser lidos como conflito | ordem-de-absorcao.md × plano-de-modulos.md | ordem-conflitante | **baixa** | A ordem de **absorção** põe Mensageria (018) em #16; o **plano de módulos** põe Mensageria como **Marco 1**. São eixos diferentes (escrita de caderno × marco de build) e ambos os docs declaram isso (ordem §Nota; plano §intro), mas a divergência numérica é fácil de confundir | Manter, reforçando a nota cruzada ("absorção ≠ marco de build") em ambos os docs |

## Itens para decisão humana (severidade **alta**)

1. **O-01 — Colisão no slot 09 do caderno-3.** `09-hierarchical-theme-customization.md` já existe; rfc-006 quer criar `09-design-system.md`. Toda a sequência de numeração de docs do caderno-3 (rfc-006 em diante) está deslocada por causa disso. **Decisão necessária antes de qualquer absorção:** fixar o mapa de numeração final do caderno-3 (renumerar o design-system para 10 e deslocar +1, ou incorporar/mover o hierarchical-theme).

2. **O-02 — Colisão no slot 22 do caderno-3.** rfc-021 (Mapa) e rfc-022 (Workflow) reivindicam ambos `caderno-3-sdk/22-…`. Resolver junto com O-01, num único mapa de numeração.

3. **L-01 — Ressurreição de deadline em P2P (rfc-022).** Sem mecanismo de recuperação distribuída de timers HLC, prazos/SLA de workflow podem ser silenciosamente perdidos quando o orquestrador cai. Bloqueia a confiabilidade da engine de workflow (que é pré-requisito de checkout, cobrança, fulfillment e dispatch).

4. **L-02 — k-anonimato na segmentação (rfc-015)** e **L-03 — MoR + hard-stop legal (rfc-009).** Dois riscos de produto que precisam de decisão antes de implementar: (a) segmentação sem coorte mínimo de-anonimiza usuários; (b) degradação silenciosa onde a lei exige bloqueio rígido (ex.: expedição sem NF-e) é risco de conformidade real, e o modelo de MoR está ausente para marketplace multi-vendor.

> Nota de método: cada item foi verificado lendo as duas fontes em conflito (ou confirmando ausência por Grep no destino). Suspeitas que não se confirmaram estão na seção "rebaixadas" acima e **não** entraram na tabela.
