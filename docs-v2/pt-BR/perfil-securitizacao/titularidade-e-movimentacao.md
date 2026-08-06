---
id: titularidade-e-movimentacao
tipo: dominio
status: ativo
perfil: corporate-regulated/securitization
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 11.3)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (seções 6.2 e 12.6)
conceitos:
  - conta-de-titular
  - ordem-de-movimentacao
---

# Titularidade e movimentação

## 1. Conta de titular

Cada titular tem uma conta individual por emissão.

```typescript
interface HolderAccount {
  account_id: Ulid;
  issuance_id: Ulid;
  holder_legal_identity_id: Ulid;  // identidade legal do titular
  beneficial_owner_ids: Ulid[];    // beneficiários finais
  kyc_record_id: Ulid;             // KYC aprovado e vigente
  segregated_estate_id: Ulid | null;  // patrimônio separado, quando houver
  opened_at: number;
  state: 'active' | 'blocked' | 'closed';
}
```

Regras:

1. Nenhuma conta abre sem `KycRecord` aprovado.
2. A conta registra o beneficiário final e o vínculo com o KYC.
3. Uma conta `blocked` não origina nem recebe movimentos.

## 2. Movimentos

```typescript
type MovementKind =
  | 'subscription'     // subscrição
  | 'payment_in'       // integralização
  | 'transfer'         // transferência
  | 'cancellation'     // cancelamento
  | 'redemption'       // resgate
  | 'conversion'       // conversão
  | 'amortization'     // amortização
  | 'reversal';        // estorno compensatório

interface Movement {
  movement_id: Ulid;
  issuance_id: Ulid;
  kind: MovementKind;
  order_id: Ulid;                // ordem válida que autorizou o movimento
  debit_account_id: Ulid | null;
  credit_account_id: Ulid | null;
  quantity: bigint;              // quantidade de títulos
  unit_price_cents: bigint | null;
  compensates: Ulid | null;      // movimento estornado, quando kind=reversal
  feed_cursor: Cursor;           // posição no change feed
  executed_at: number;
}
```

Regras:

1. Cada movimento aponta para uma ordem válida.
2. Nenhum movimento altera um movimento confirmado. Uma correção usa
   `kind = 'reversal'` com `compensates` preenchido.
3. A posição de uma conta é a projeção dos movimentos confirmados.

## 3. Ordens

```typescript
interface MovementOrder {
  order_id: Ulid;
  issuance_id: Ulid;
  kind: MovementKind;
  requester_identity_id: Ulid;
  signer_binding_ids: Ulid[];    // vínculos chave ↔ identidade legal
  representation_powers: string[];  // poderes exigidos e comprovados
  approval_chain: ApprovalStep[];
  support_document_ids: Ulid[];  // documentos de suporte
  effective_at: number;
  state: 'pending' | 'approved' | 'rejected' | 'executed';
}

interface ApprovalStep {
  approver_identity_id: Ulid;
  role: string;                  // papel na cadeia de aprovação
  evidence_package_id: Ulid;     // pacote de evidência da aprovação
  decided_at: number;
  decision: 'approved' | 'rejected';
}
```

Regras:

1. Cada ordem prova identidade, poderes e aprovações.
2. O perfil exige dupla aprovação para eventos sensíveis definidos na
   política da rede.
3. Uma ordem rejeitada não gera movimento.
4. A ordem e sua cadeia de aprovação ficam retidas pela classe documental
   correspondente.

## 4. Erros normativos

| Código | Condição |
| :--- | :--- |
| `ORDER_INVALID` | ordem sem prova de identidade, poderes ou aprovação |
| `ACCOUNT_BLOCKED` | conta de origem ou destino bloqueada |
| `LIEN_CONFLICT` | gravame ativo incompatível com o movimento |
| `INSUFFICIENT_POSITION` | quantidade maior que a posição disponível |
| `ESTATE_MISMATCH` | contas de patrimônios separados incompatíveis |

## 5. Testes de conformidade

1. Um movimento sem ordem aprovada é rejeitado.
2. Um estorno não altera o movimento original.
3. A posição por data-base reconstrói o mesmo resultado do fechamento.
4. Uma transferência para conta sem KYC aprovado é rejeitada.
