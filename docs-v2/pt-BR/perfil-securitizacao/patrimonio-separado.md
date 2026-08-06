---
id: patrimonio-separado
tipo: dominio
status: ativo
perfil: corporate-regulated/securitization
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seções 4.3 e 11.6)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (seção 5)
conceitos:
  - patrimonio-separado
---

# Patrimônio separado

Um regime fiduciário exige isolamento por patrimônio separado. Cada
patrimônio separado tem registros contábeis independentes. O acesso e os
relatórios respeitam o mesmo isolamento.

## 1. Tipo exato

```typescript
interface SegregatedEstate {
  estate_id: Ulid;
  network_id: Ulid;
  issuance_id: Ulid;
  fiduciary_term_document_id: Ulid;  // termo de securitização
  external_registration_id: Ulid | null;  // registro do instrumento
  ledger_partition: string;          // partição exclusiva do change feed
  chart_of_accounts_id: Ulid;        // plano de contas próprio
  created_at: number;
  state: 'active' | 'wound_up';      // wound_up = liquidado
}
```

## 2. Regras de isolamento

1. Todo registro, conta, acesso e relatório do patrimônio carrega o
   `estate_id`. O identificador é obrigatório.
2. O change feed do patrimônio usa uma partição exclusiva.
3. Referências econômicas entre patrimônios incompatíveis são rejeitadas
   com o erro `ESTATE_MISMATCH`.
4. O razão e as demonstrações de cada patrimônio são independentes.
5. Uma movimentação entre contas de patrimônios diferentes exige um ato
   jurídico próprio e nunca é um movimento interno.

## 3. Acesso e relatórios

1. As permissões de leitura e escrita são escopadas por `estate_id`.
2. Um relatório de um patrimônio não inclui dados de outro patrimônio.
3. A revisão periódica de acessos cobre cada patrimônio de forma
   independente.

## 4. Contábil

1. Cada patrimônio tem razão próprio e demonstrações próprias.
2. Os fechamentos de um patrimônio não misturam posições de outro.
3. A liquidação (`wound_up`) gera o fechamento final e encerra a partição
   para novas escritas. A leitura histórica permanece.

## 5. Testes de conformidade

1. Um registro sem `estate_id` é rejeitado no perfil.
2. Um movimento entre contas de patrimônios diferentes falha com
   `ESTATE_MISMATCH`.
3. Um relatório de um patrimônio não contém dados de outro.
4. A partição de um patrimônio liquidado recusa novas escritas.
