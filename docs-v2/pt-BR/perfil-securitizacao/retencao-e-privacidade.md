---
id: retencao-e-privacidade
tipo: dominio
status: ativo
perfil: corporate-regulated/securitization
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seções 4.6 e 12)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (seção 8)
conceitos:
  - politica-de-retencao
  - legal-hold
  - base-legal-lgpd
---

# Retenção e privacidade

Este documento aplica ao perfil de securitização as regras de retenção do
schema (ver `docs-v2/sdk/sqlite-schema.md`) e as bases legais da LGPD.

## 1. Invariantes do perfil

1. O ledger autoritativo e suas réplicas de recuperação não aplicam poda
   destrutiva a registros sob retenção.
2. O cliente pode podar payloads locais quando a política permitir. A
   autoridade preserva o registro integral e prova a continuidade.
3. O descarte é governado por classe documental, evento inicial, fundamento,
   legal hold e aprovação.
4. Nenhum prazo universal existe. O prazo vem da classe e do fundamento.
5. Nenhuma anonimização destrói assinatura, documento de suporte ou vínculo
   de titularidade ainda necessário a obrigação legal, exercício de
   direitos ou defesa em processo.
6. Toda política de retenção é versionada e reproduz o resultado vigente
   na data da decisão.

## 2. Bases legais por finalidade

A LGPD não torna o consentimento a base universal. O perfil registra a base
legal de cada finalidade de tratamento.

```typescript
type LegalBasis =
  | 'legal_obligation'       // obrigação legal ou regulatória
  | 'contract_execution'     // execução de contrato
  | 'rights_exercise'        // exercício regular de direitos
  | 'credit_protection'      // proteção de crédito
  | 'consent';               // consentimento, quando adequado

interface ProcessingPurpose {
  purpose_id: Ulid;
  purpose: string;
  legal_basis: LegalBasis;
  data_categories: string[];
  retention_class_id: string;
  policy_version: string;
}
```

## 3. Pedidos de direitos do titular

1. Um pedido de exclusão não apaga registros mantidos por obrigação legal
   ou regulatória.
2. A resposta restringe uso e acesso, registra a base de retenção e agenda
   a exclusão para quando cessarem todas as bases aplicáveis.
3. Toda decisão sobre um pedido fica registrada com fundamento e
   aprovador.
4. Um legal hold bloqueia descarte e anonimização incompatíveis.

```typescript
interface RightsRequest {
  request_id: Ulid;
  subject_legal_identity_id: Ulid;
  kind: 'access' | 'deletion' | 'portability' | 'rectification';
  state: 'received' | 'under_review' | 'answered';
  answer: string | null;         // resposta fundamentada
  retention_bases_kept: LegalBasis[];  // bases que mantiveram dados
  scheduled_erasure_at: number | null; // exclusão agendada
  decided_by: string;
  decided_at: number | null;
}
```

## 4. Exportação de evidências

A plataforma exporta evidências em formato inteligível e independente da
aplicação: extratos, listas de titulares, livros, pacotes de evidência de
assinatura e cadeias de fechamento com seus hashes.

## 5. Testes de conformidade

1. Um pedido de exclusão sobre registro sob obrigação legal resulta em
   restrição de uso, não em apagamento.
2. Um legal hold bloqueia um descarte autorizado pela política.
3. A política de retenção aplicada é a vigente na data da decisão.
4. A exportação de um fechamento valida fora da aplicação por hash.
