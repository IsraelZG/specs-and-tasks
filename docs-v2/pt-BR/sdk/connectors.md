---
id: connectors
tipo: sdk
status: ativo
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 13)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (seções 10 e 12.7)
  - docs/caderno-3-sdk/06-connectors.md (taxonomia herdada)
substitui:
  - docs/caderno-3-sdk/06-connectors.md
conceitos:
  - conector-externo
  - matriz-de-habilitacao-fiscal
---

# Conectores externos

A taxonomia de cinco classes permanece: egresso notificacional (A), ingresso
content-blind (B), oráculo transacional (C), espelho bidirecional (D) e
provedor de consulta (E). Este documento define as portas exigidas pelo
perfil de securitização.

## 1. Portas do perfil de securitização

| Porta | Classe | Obrigatoriedade |
| :--- | :--- | :--- |
| Junta Comercial | C | obrigatória |
| Entidade de registro | C | condicional ao enquadramento |
| Depositário central | C | condicional ao enquadramento |
| Provedor de assinatura | C | obrigatória |
| Validador ICP-Brasil | E | obrigatória quando o nível exigir |
| Autoridade de Carimbo do Tempo | C | condicional à política de assinatura |
| Bancos e contas vinculadas | D | obrigatória |
| Conciliação bancária | D | obrigatória |
| PEP, sanções e beneficiário final | E | obrigatória |
| eSocial e EFD-Reinf | C | obrigatória para fatos desde 2025 |
| e-Financeira | C | condicional à matriz de habilitação |

## 2. Contrato de evidência por chamada

Cada chamada a um conector do perfil preserva:

```typescript
interface ConnectorCallEvidence {
  call_id: Ulid;
  connector_id: string;
  operation: string;
  request_payload: Uint8Array;     // solicitação integral
  response_payload: Uint8Array;    // resposta integral
  protocol_ref: string | null;     // protocolo retornado pelo órgão
  receipt_ref: string | null;      // recibo retornado pelo órgão
  layout_version: string;          // versão do leiaute usado
  technical_identity: string;      // identidade técnica do emissor
  business_event_id: Ulid;         // evento de negócio relacionado
  called_at: number;
}
```

Regras:

1. Uma retificação é um novo evento. Ela não altera a chamada original.
2. A idempotência usa `external_ref` do provedor. Uma reentrega com o mesmo
   `external_ref` é um no-op.
3. Credenciais ficam fora do grafo, no secret store do operador.
4. Ingresso não autenticável degrada para polling.

## 3. Matriz de habilitação fiscal

O perfil mantém uma matriz versionada de habilitação fiscal. A matriz
decide a ativação de cada obrigação. O nome "securitizadora" não ativa
nenhuma obrigação por si só.

```typescript
interface FiscalEnablementMatrix {
  matrix_version: string;
  entity_type: string;             // tipo de entidade
  activities: string[];            // atividades efetivamente exercidas
  products: string[];              // produtos oferecidos
  supervisor: string | null;       // órgão supervisor aplicável
  obligations: FiscalObligation[];
  approved_by: string;             // responsável pela análise
  approved_at: number;
}

interface FiscalObligation {
  obligation: 'esocial' | 'efd_reinf' | 'e_financeira';
  enabled: boolean;
  legal_basis: string;             // fundamento do enquadramento
  layout_version: string;
  effective_from: string;          // ano-calendário inicial
}
```

Regras:

1. eSocial e EFD-Reinf cobrem fatos desde o ano-calendário de 2025. A DIRF
   não é modelada como obrigação futura.
2. A e-Financeira é ativada somente após análise de enquadramento
   registrada na matriz.
3. Uma mudança de atividades exige nova versão da matriz.

## 4. Conectores e a autoridade

Todo conector das classes C e D atua como persona de sistema com papel
escopado. Tudo que o conector publica no grafo é assinado por essa persona.
O conector é uma capacidade da autoridade, nunca do cliente.

## 5. Testes de conformidade

1. Uma chamada sem `request_payload` ou `response_payload` preservado falha
   na auditoria.
2. Uma retificação cria um novo evento e mantém o original.
3. A e-Financeira permanece desativada sem análise de enquadramento na
   matriz.
4. Uma reentrega com o mesmo `external_ref` não duplica o fato no grafo.
