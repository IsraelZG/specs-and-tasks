---
id: cryptographic-lineage-and-auth
tipo: protocolo
status: ativo
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 4.4)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (seções 9 e 12.3)
  - docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md (base técnica herdada)
substitui:
  - docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md
conceitos:
  - vinculo-chave-identidade
  - nivel-de-assinatura
  - pacote-de-evidencia
  - linhagem-de-versoes
  - epoca-de-identidade
---

# Linhagem criptográfica, identidade legal e assinatura

Este documento define identidade criptográfica, vínculo com a identidade
legal, níveis de assinatura e linhagem de versões. O modelo de chaves,
UCAN, HLC e épocas herdados permanece válido. Este texto registra somente o
que muda e o que se mantém normativo.

## 1. Vínculo entre chave e identidade legal

O perfil regulado vincula cada chave de assinatura a uma identidade legal.
O vínculo é um registro do grafo oficial.

```typescript
type SignatureLevel = 'basic' | 'advanced' | 'qualified' | 'qualified_timestamped';

interface KeyIdentityBinding {
  binding_id: Ulid;
  network_id: Ulid;
  subject_key: PubKey;          // chave Ed25519 vinculada
  legal_identity_id: Ulid;      // identidade civil ou empresarial verificada
  representation_powers: string[];  // poderes de representação no ato
  valid_from: number;           // ms Unix
  valid_until: number | null;   // null enquanto vigente
  kyc_record_id: Ulid;          // evidência de verificação
  evidence_package_id: Ulid;    // pacote de evidência do vínculo
  created_at: number;
  signature: Signature;         // assinatura da autoridade
}
```

Regras:

1. O vínculo registra o período de validade.
2. O vínculo registra os poderes de representação.
3. Uma revogação de chave fecha `valid_until`. Ela não apaga o vínculo nem a
   autoria histórica dos atos assinados na vigência.
4. A validação de um ato usa o vínculo vigente no instante do ato.

## 2. Níveis de assinatura

A política define o nível exigido por risco e por tipo de ato. ICP-Brasil e
carimbo de tempo de ACT não são requisitos gerais de todo ato privado. Uma
assinatura fora da ICP-Brasil pode ser válida.

| Nível | Uso típico | Evidência mínima |
| :--- | :--- | :--- |
| `basic` | atos internos de baixo risco | sessão autenticada, registro assinado, contexto |
| `advanced` | contratos e ordens privadas usuais | provedor de assinatura, MFA, identificação, dispositivo, hash do documento, evidência de aceite, relatório do provedor |
| `qualified` | escritura, atos de alto valor, poderes sensíveis | certificado ICP-Brasil e validação da cadeia e da revogação |
| `qualified_timestamped` | instrumentos críticos e ancoragens periódicas | assinatura qualificada e carimbo de tempo de ACT credenciada |

O carimbo de tempo prova que o resumo do documento existia quando a ACT o
recebeu. Ele não prova a data original de criação. Use o carimbo como
reforço probatório quando a política exigir.

## 3. Pacote de evidência de assinatura

Toda assinatura relevante preserva um pacote de evidência.

```typescript
interface SignatureEvidencePackage {
  package_id: Ulid;
  document_hash: Hash32;        // hash do documento exato assinado
  document_version: number;
  signer_key: PubKey;
  binding_id: Ulid;             // vínculo chave ↔ identidade legal
  level: SignatureLevel;
  method: string;               // provedor e método usados
  provider_report_ref: string | null;
  mfa_evidence: boolean;
  policy_version: string;       // política de assinatura aceita
  signed_at: number;            // ms Unix, com fuso registrado
  certificate_chain: Uint8Array | null;  // quando ICP-Brasil
  revocation_check_at: number | null;
  timestamp_token: Uint8Array | null;    // carimbo ACT, quando exigido
  signature: Signature;
}
```

A assinatura criptográfica de um evento do grafo e a assinatura jurídica do
documento subjacente são objetos distintos. O pacote de evidência liga os
dois.

## 4. Linhagem de versões (mantida)

O grafo é append-only. Cada nó e aresta tem assinatura Ed25519 sobre seus
campos planos e o payload cifrado. A aresta `MUTATES` carrega
`previous_hash` em coluna plana e indexada. O head de uma entidade é o
nó-versão de maior HLC da linhagem. Um filho com `HLC(filho) <= HLC(pai)` é
rejeitado como malformado.

## 5. Época de identidade (mantida)

A época de identidade versiona atestação de identidade, delegações de
dispositivo e revogações. Os eventos que incrementam a época formam uma
lista fechada. São eles: rotação da chave mestra ou de persona, revogação
de UCAN raiz, emissão ou revogação de delegação de dispositivo e mudança
no modelo de recuperação. O erro `STALE_EPOCH` refere-se somente a esta época.

## 6. Rotação de chaves sob autoridade

A autoridade controla a distribuição e a rotação das chaves de época. O Key
Vault de Rede expõe
`requestEpochKey(ucan, scope, prova_de_delegacao) -> chave | DENIED`.
A rotação cooperativa entre peers comuns deixa de existir como mecanismo
oficial. Ver `docs-v2/adr/ADR-001-autoridade-logica.md`.

## 7. Erros normativos

| Código | Condição |
| :--- | :--- |
| `BINDING_EXPIRED` | vínculo fora da vigência no instante do ato |
| `BINDING_NOT_FOUND` | chave sem vínculo legal no perfil regulado |
| `POWER_INSUFFICIENT` | poder de representação ausente para o ato |
| `LEVEL_INSUFFICIENT` | nível de assinatura abaixo do exigido pela política |
| `EVIDENCE_INCOMPLETE` | pacote de evidência sem campo obrigatório |

## 8. Testes de conformidade

1. Um ato assinado após `valid_until` do vínculo é rejeitado.
2. A revogação de uma chave não altera a verificação de atos da vigência.
3. Um ato que exige `qualified` falha com evidência de nível `advanced`.
4. Um pacote de evidência sem `document_hash` é rejeitado.
5. A validação usa o vínculo vigente na data do ato, não o vínculo atual.
