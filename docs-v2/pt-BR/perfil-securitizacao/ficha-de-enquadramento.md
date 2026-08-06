---
id: ficha-de-enquadramento
tipo: dominio
status: ativo
perfil: corporate-regulated/securitization
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seções 4.1, 4.2, 4.3 e 11.1)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (seção 3)
conceitos:
  - ficha-de-enquadramento
---

# Ficha de enquadramento

A ficha de enquadramento é um registro versionado de cada emissão. Ela
documenta a classificação jurídica. A emissão fica bloqueada enquanto a
ficha estiver incompleta ou sem aprovação.

## 1. Tipo exato

```typescript
type PlacementKind = 'private' | 'public';
type DebentureForm = 'nominative_non_book_entry' | 'book_entry';

interface FramingRecord {
  framing_id: Ulid;
  issuance_id: Ulid;             // emissão classificada
  version: number;               // reclassificação cria nova versão
  placement: PlacementKind;      // colocação privada ou oferta pública
  form: DebentureForm;           // forma do título
  central_depository: boolean;   // depósito centralizado
  is_securitization: boolean;    // operação de securitização (Lei 14.430)
  is_receivables_certificate: boolean;  // Certificado de Recebíveis
  fiduciary_regime: boolean;     // regime fiduciário
  segregated_estate: boolean;    // patrimônio separado
  external_registrations_required: string[];  // registros externos exigidos
  legal_officer: string;         // responsável jurídico
  evidence_ids: Ulid[];          // evidências da classificação
  approved_at: number | null;    // null enquanto não aprovada
  supersedes: Ulid | null;       // versão anterior da ficha
}
```

## 2. Máquina de estados

```
draft → under_review → approved → (reclassified → nova versão em draft)
```

1. `draft`: ficha em preenchimento.
2. `under_review`: ficha completa, aguardando o responsável jurídico.
3. `approved`: emissão desbloqueada.
4. Uma mudança na distribuição, na forma ou na estrutura abre uma nova
   versão em `draft`. A versão anterior permanece no histórico.

## 3. Regras

1. Nenhuma emissão inicia sem ficha em `approved`.
2. A ficha registra destinatários, canais e materiais da colocação.
3. `placement = 'public'` exige regime de oferta pública. O perfil de
   securitização privada não cobre esse caso. A emissão para até novo
   enquadramento.
4. `form = 'book_entry'`, oferta pública ou depósito centralizado exigem
   integração com infraestrutura autorizada. Ver
   `docs-v2/perfil-securitizacao/registro-externo.md`.
5. `is_securitization = true` ou `fiduciary_regime = true` ativam as
   obrigações de patrimônio separado. Ver
   `docs-v2/perfil-securitizacao/patrimonio-separado.md`.
6. `is_receivables_certificate = true` exige registro externo bloqueante.

## 4. Erros normativos

| Código | Condição |
| :--- | :--- |
| `FRAMING_INCOMPLETE` | campo obrigatório ausente |
| `FRAMING_NOT_APPROVED` | emissão tentada sem aprovação |
| `FRAMING_STALE` | fato novo exige reclassificação |
| `EXTERNAL_REGISTRATION_REQUIRED` | enquadramento exige registro ausente |

## 5. Testes de conformidade

1. Uma emissão sem ficha aprovada é bloqueada.
2. Uma reclassificação cria uma nova versão e preserva a anterior.
3. Uma ficha com `form = 'book_entry'` sem registro externo bloqueia a
   emissão.
4. Os destinatários, canais e materiais ficam ligados à ficha.
