---
id: registro-externo
tipo: dominio
status: ativo
perfil: corporate-regulated/securitization
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 11.7)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (seções 4, 5 e 12.6)
conceitos:
  - registro-externo
---

# Registro externo

O registro externo liga a emissão a uma entidade autorizada quando o
enquadramento exigir. O registro é bloqueante nesses casos.

## 1. Tipo exato

```typescript
interface ExternalRegistration {
  registration_id: Ulid;
  issuance_id: Ulid;
  entity: string;                // entidade de registro ou depósito
  required: boolean;             // definido pela ficha de enquadramento
  blocking: boolean;             // bloqueia o fluxo quando exigido
  protocol_ref: string | null;   // protocolo junto à entidade
  receipt_ref: string | null;    // recibo de confirmação
  state: ExternalRegistrationState;
  divergence: string | null;     // divergência detectada na reconciliação
  rectification_of: Ulid | null; // retificação de registro anterior
}

type ExternalRegistrationState =
  | 'pending'        // aguardando envio
  | 'submitted'      // protocolado
  | 'confirmed'      // registrado
  | 'divergent'      // divergência em reconciliação
  | 'rectified';     // retificado por novo evento
```

## 2. Regras

1. A ficha de enquadramento define se o registro é exigido e bloqueante.
2. Uma emissão com registro bloqueante não avança sem `state = 'confirmed'`.
3. O sistema registra entidade, protocolo, recibo e estado.
4. Uma divergência entre a posição interna e a externa muda o estado para
   `divergent` e bloqueia novos movimentos da emissão.
5. Uma retificação é um novo evento com `rectification_of` preenchido. Ela
   não altera o registro original.
6. A reconciliação periódica compara a posição oficial interna com a
   posição da entidade externa.

## 3. Quando o registro é exigido

| Condição na ficha | Consequência |
| :--- | :--- |
| `is_receivables_certificate = true` | registro ou depósito obrigatório |
| `fiduciary_regime = true` | registro do instrumento do regime fiduciário |
| `placement = 'public'` | infraestrutura autorizada. Fora do escopo deste perfil |
| `central_depository = true` | integração com depositário e reconciliação |
| `form = 'book_entry'` | instituição autorizada e reconciliação |

## 4. Erros normativos

| Código | Condição |
| :--- | :--- |
| `EXTERNAL_REGISTRATION_REQUIRED` | fluxo avançou sem registro confirmado |
| `REGISTRATION_DIVERGENT` | reconciliação detectou divergência não retificada |

## 5. Testes de conformidade

1. Uma emissão com registro bloqueante não confirma movimentos antes de
   `confirmed`.
2. Uma divergência de reconciliação bloqueia novos movimentos.
3. Uma retificação preserva o registro original e o vínculo entre eles.
