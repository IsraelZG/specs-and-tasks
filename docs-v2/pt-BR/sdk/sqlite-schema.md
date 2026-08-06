---
id: sqlite-schema
tipo: sdk
status: ativo
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 12)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (seções 8 e 12.4)
  - docs/caderno-3-sdk/01-sqlite-and-projections-schema.md (schema herdado)
substitui:
  - docs/caderno-3-sdk/01-sqlite-and-projections-schema.md
conceitos:
  - estado-de-retencao
  - politica-de-retencao
  - legal-hold
---

# Schema SQLite e projeções

O banco local usa SQLite. As tabelas `nodes` e `edges` herdadas permanecem
append-only. Este documento registra o que muda: a separação dos quatro
estados e a política de retenção por classe documental.

## 1. Quatro estados separados

O schema separa quatro estados. Nenhum campo único os combina.

| Estado | Campo | Escopo |
| :--- | :--- | :--- |
| 1. Sincronização da réplica | `sync_state` | réplica local |
| 2. Retenção da fonte autoritativa | `retention_state` + `retention_class_id` | autoridade |
| 3. Privacidade e visibilidade | `privacy_state` | por registro |
| 4. Jurídico do título | `legal_state` | perfil regulado |

```sql
ALTER TABLE nodes ADD COLUMN sync_state INTEGER NOT NULL DEFAULT 0;
-- 0=pending, 1=confirmed, 2=superseded_by_compensation

ALTER TABLE nodes ADD COLUMN retention_state INTEGER NOT NULL DEFAULT 0;
-- 0=integral, 1=pruned_replica, 2=compressed, 3=quarantine
-- expunged como valor destrutivo deixa de existir; ver seção 3

ALTER TABLE nodes ADD COLUMN retention_class_id TEXT;
-- referência à política versionada de retenção

ALTER TABLE nodes ADD COLUMN privacy_state INTEGER NOT NULL DEFAULT 0;
-- 0=normal, 1=restricted_use, 2=anonymized_fields

ALTER TABLE nodes ADD COLUMN legal_state INTEGER;
-- definido pelo perfil regulado; NULL no núcleo genérico

-- As mesmas colunas existem em edges.
```

## 2. Poda como política de réplica

A poda é uma política da réplica. Ela não destrói a fonte autoritativa.

1. O cliente pode podar uma réplica quando a política permitir.
2. A autoridade mantém a cópia integral exigida pela classe documental.
3. A réplica podada preserva id, hash, assinatura e prova de continuidade.
4. Réplicas de recuperação da autoridade não aplicam poda destrutiva a
   registros sob retenção.
5. Reidratação, restauração e reconstrução por data-base são testáveis.

## 3. Descarte governado

Nenhum processo de descarte remove a única cópia de documentos, assinaturas,
ordens ou relações de titularidade ainda sujeitos a guarda. O antigo estado
`expunged` não se aplica a registros sob retenção ou legal hold.

O descarte exige: classe documental, fundamento legal, evento inicial do
prazo, prazo vencido, ausência de legal hold e aprovação registrada.

## 4. Política de retenção versionada

Cada classe documental tem uma política versionada. Os nomes dos campos são
fixos:

```typescript
interface RetentionPolicy {
  document_class: string;      // classe documental
  legal_basis: string;         // fundamento legal
  start_event: string;         // evento que inicia o prazo
  retention_period: string;    // duração ISO 8601 (ex.: "P5Y")
  extension_rule: string;      // regra de prorrogação
  legal_hold: boolean;         // hold ativo bloqueia descarte
  final_disposition: 'archive' | 'anonymize' | 'destroy';
  approver: string;            // aprovador da política
  policy_version: string;      // versão semântica
}
```

Regras:

1. A política vigente na data da decisão é reproduzível.
2. Um legal hold bloqueia descarte e anonimização incompatíveis.
3. Não existe prazo universal. O prazo vem da classe e do fundamento.
4. Um pedido LGPD não apaga dados mantidos por obrigação legal. A resposta
   restringe uso e acesso, registra a base de retenção e agenda a exclusão
   para quando cessarem as bases aplicáveis.

## 5. Projeções locais (mantidas)

As projeções `entity_heads`, `active_edges`, `asset_balances` e
`local_permissions` permanecem locais e não replicadas. O head continua
sendo o nó-versão de maior HLC da linhagem.

## 6. Outbox durável

A outbox de propostas offline é uma tabela local não replicada.

```sql
CREATE TABLE outbox (
  proposal_id TEXT PRIMARY KEY,   -- ULID; idempotência
  partition TEXT NOT NULL,
  payload BLOB NOT NULL,
  ucan BLOB NOT NULL,
  created_at INTEGER NOT NULL,
  state INTEGER NOT NULL DEFAULT 0,  -- 0=pending, 1=sent, 2=confirmed, 3=rejected
  result BLOB
);
```

Uma proposta na outbox não pertence ao grafo oficial. O Sync Worker reenvia
propostas `pending` e `sent` até receber `ProposalResult`.

## 7. Testes de conformidade

1. Um lote aplicado avança `sync_state` e o cursor na mesma transação.
2. Uma réplica podada mantém id, hash e assinatura do registro.
3. Um descarte sob legal hold é bloqueado e registrado.
4. A reconstrução por data-base reproduz a posição histórica.
5. Uma proposta confirmada sai da outbox sem criar segundo registro.
