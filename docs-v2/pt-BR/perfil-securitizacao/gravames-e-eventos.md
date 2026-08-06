---
id: gravames-e-eventos
tipo: dominio
status: ativo
perfil: corporate-regulated/securitization
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 11.4)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (seção 12.6)
conceitos:
  - gravame
---

# Gravames, bloqueios e eventos financeiros

## 1. Gravames

```typescript
type LienKind =
  | 'pledge'              // penhor
  | 'fiduciary_assignment'// cessão fiduciária
  | 'usufruct'            // usufruto
  | 'judicial_block'      // bloqueio judicial
  | 'circulation_restriction';  // restrição à circulação

interface Lien {
  lien_id: Ulid;
  issuance_id: Ulid;
  account_id: Ulid;              // conta gravada
  kind: LienKind;
  beneficiary_identity_id: Ulid; // beneficiário do gravame
  priority: number;              // ordem de prioridade
  support_document_ids: Ulid[];  // documentos que instituem o gravame
  effective_from: number;
  effective_until: number | null;  // null enquanto vigente
  state: 'active' | 'released' | 'expired';
}
```

Regras:

1. O gravame registra tipo, beneficiário, prioridade e vigência.
2. Um movimento incompatível com um gravame ativo é bloqueado com o erro
   `LIEN_CONFLICT`.
3. A baixa do gravame é um evento novo. Ela não altera o registro de
   instituição.
4. A prioridade resolve a concorrência entre gravames sobre a mesma
   posição.

## 2. Eventos financeiros

```typescript
type FinancialEventKind =
  | 'interest'              // juros
  | 'premium'               // prêmio
  | 'amortization'          // amortização
  | 'early_maturity'        // vencimento antecipado
  | 'payment'               // pagamento
  | 'withholding'           // retenção na fonte
  | 'bank_reconciliation';  // conciliação bancária

interface FinancialEvent {
  event_id: Ulid;
  issuance_id: Ulid;
  kind: FinancialEventKind;
  calculation_base_hash: Hash32; // dados de cálculo usados
  amount_cents: bigint;
  currency: 'BRL';
  due_date: string;              // ISO 8601
  settled_at: number | null;
  payment_evidence_id: Ulid | null;  // evidência do pagamento
  withholding_receipt: string | null;  // recibo da retenção
  bank_reconciliation_ref: string | null;
}
```

Regras:

1. O evento registra a base de cálculo por hash.
2. O pagamento liga-se a uma evidência e à conciliação bancária.
3. A retenção na fonte guarda o recibo e alimenta os conectores fiscais.
   Ver `docs-v2/sdk/connectors.md`.
4. Um evento liquidado não muda. Uma correção cria um evento
   compensatório.

## 3. Testes de conformidade

1. Uma transferência sobre posição com `judicial_block` ativo falha.
2. A baixa de um gravame preserva o registro de instituição.
3. Um evento de juros sem base de cálculo registrada é inválido.
4. Um pagamento sem conciliação permanece `settled_at = null`.
