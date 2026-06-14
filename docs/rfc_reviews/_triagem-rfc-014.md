# Triagem — rfc-014 (Contábil, Fiscal e RH)

**Fonte:** `docs/rfcs/rfc-014-contabil-fiscal-rh.md` + `docs/rfc_reviews/review_rfc-014.md`
(+ contexto da auditoria de consistência L-04, médio: RH/folha não referencia o framework LGPD canônico).

## Contagens por veredito
- INCORPORAR: 3
- JA-COBERTO: 3
- UI->INVENTARIO: 6
- REJEITAR: 0
- REVISAR-HUMANO: 1
- **Σ achados: 13**

## REVISAR-HUMANO (em destaque)
- **014-04** — Conector nativo de assinatura por Hard Token (Certificado A1/A3, PkiBrazil/Smartcard, cifragem TLS local) para o perfil Contador assinar o batch (SPED/ECD) antes de injetar no conector oficial. Introduz **mecanismo novo** (conector de assinatura criptográfica com hardware) ausente da RFC e do canônico; é decisão arquitetural sobre como o assinador se encaixa nas classes de conector (RFC-007) e no key-vault. Não redigir norma — decidir primeiro o modelo.

## Tabela

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 014-01 | §2 — Reclassificação massiva retroativa (corrigir regra Zen + recálculo sobre milhares de faturas) trava a aba no local-first; deve ir para fila de computação assíncrona em background (RFC-010) | INCORPORAR | `A.6` (existente, §recálculo retroativo) | Adicionar a A.6.2: "Recálculos retroativos massivos (reclassificação de competência inteira após nova versão de regra) **não executam síncronos no dispositivo**: são despachados à **fila de computação assíncrona** (RFC-010) em background, preservando a responsividade local-first; o resultado é materializado como novos fatos derivados com competência e versão de regra marcadas." | [x] |
| 014-02 | §2 / L-04 — RH/folha (colaborador, ponto, eventos, folha) trata dado pessoal sensível e não referencia o framework LGPD canônico (consentimento, expurgo, retenção legal) | INCORPORAR | `A.5` (existente, §5) | Adicionar a A.5.5: "Dados pessoais de colaborador e eventos de trabalho são tratados sob o framework de privacidade canônico [[03-legal-and-compliance-framework]]: consentimento de primeira classe (`ASSET:CONSENT` §2.1), portabilidade/exclusão por `CONTENT:INTENT` (§2.2–2.3) e **retenção legal prevalecente** (§2.3) sobre folha/encargos sujeitos a obrigação trabalhista/fiscal — que não são passíveis de expurgo enquanto vigente a retenção." | [x] |
| 014-03 | §2 — Rejeição de NFe retroativa em mês fechado deveria, no próprio prompt de erro, oferecer "Criar Intent de Pedido de Reabertura ao Contador" (caminho de UI) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Molécula: `PeriodLockRejectionPrompt` (prompt de rejeição por bloqueio de competência que oferece ação "criar intent de reabertura") — módulo Contábil/Fiscal (ERP). A mecânica de reabertura por intent auditável já é coberta por A.4.3/A.6.3; o achado é só o gancho de UI. | [x] |
| 014-04 | §2 — Conector nativo de assinatura por Hard Token (A1/A3, PkiBrazil/Smartcard, TLS local) para o Contador assinar batch SPED/ECD antes do conector oficial | REVISAR-HUMANO | — | Mecanismo novo de assinatura criptográfica com hardware, ausente da RFC e do canônico; decisão arquitetural sobre encaixe em RFC-007 (classes de conector) e no key-vault. Ver bloco em destaque. | [x] |
| 014-05 | §3 — T-Accounts Explorer: razonetes como DataTable no Shell (RFC-026) com drill-down ao fato gerador do ERP | UI->INVENTARIO | `inventario-componentes-layouts.md` | Layout/Organismo: `TAccountsExplorer` (razonetes em DataTable no shell, drill-down ao fato gerador) — módulo Contábil (ERP). | [x] |
| 014-06 | §3 — Time-Machine do Fiscal: barra de tempo de vigência por mês com locks vermelhos para meses fechados | UI->INVENTARIO | `inventario-componentes-layouts.md` | Molécula: `FiscalTimeMachineBar` (barra de vigência por competência com locks visuais de período fechado) — módulo Fiscal (ERP). | [x] |
| 014-07 | §3 — Atom `DebitCreditBadge` | UI->INVENTARIO | `inventario-componentes-layouts.md` | Átomo: `DebitCreditBadge` — módulo Contábil. | [x] |
| 014-08 | §3 — Atom `TaxRatePill` | UI->INVENTARIO | `inventario-componentes-layouts.md` | Átomo: `TaxRatePill` — módulo Fiscal. | [x] |
| 014-09 | §3 — Molecule `EmployeePayrollRow` (resume 12 eventos de folha) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Molécula: `EmployeePayrollRow` (linha de folha resumindo eventos do colaborador) — módulo RH. | [x] |
| 014-10 | §3 — Organism `GeneralLedgerTable` (razão geral expansível) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Organismo: `GeneralLedgerTable` (razão geral expansível) — módulo Contábil. | [x] |
| 014-11 | §3 — Organism `FiscalClosingWizard` (assistente de fechamento que lista dependências incompletas) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Organismo: `FiscalClosingWizard` (assistente de fechamento de competência agrupando pendências, ex.: "Falta classificar 5 contas a pagar") — módulo Fiscal/Contábil. | [x] |
| 014-12 | §4 — Nós: variantes de SPEC de Folha e Plano de Contas versionado; Arestas: fatos/projeções derivados do grafo operacional base | JA-COBERTO | A.2.1 (plano de contas = SPECIFICATION versionado), A.5.1–A.5.3 (SPEC de folha), A.1.1–A.1.2 (lançamento = projeção derivada). Zero tipo de nó novo (cabeçalho). | — | [x] |
| 014-13 | §5 — Ciclo de vida: nascimento por derivação dinâmica; mutação = recálculo sob demanda (time-travel das leis); fim de vida = fechamento materializa snapshot + provas `external_ref` RECIBO no media plane | JA-COBERTO | A.1.2 (derivado/reconstruível), A.3/A.6.2 (recálculo por vigência), A.4.3/A.6 (fechamento congela competência). Materialização de snapshot e arquivamento de recibo via conector descritos em A.3.3/A.4.2. | — | [x] |

> Nota A.6: o recálculo retroativo já existe na RFC (A.6.2), mas como operação genérica; o achado 014-01 é a **qualificação normativa** de que o caso massivo vai à fila assíncrona (RFC-010) — daí INCORPORAR e não JA-COBERTO.
