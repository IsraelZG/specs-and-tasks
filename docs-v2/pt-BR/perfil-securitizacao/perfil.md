---
id: perfil-securitization
tipo: perfil-regulatorio
status: ativo
perfil: corporate-regulated/securitization
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seções 4 e 11)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md
conceitos:
  - perfil-regulatorio
---

# Perfil `corporate-regulated/securitization`

O perfil de securitização ativa controles obrigatórios sobre uma rede com
autoridade lógica. Um administrador comum não pode desativar esses
controles. O núcleo genérico da plataforma não muda. Os controles deste
perfil não viram regras universais do produto.

## 1. Controles obrigatórios do perfil

| Controle | Núcleo genérico | Perfil securitização |
| :--- | :--- | :--- |
| KYC e KYB | opcional | obrigatório |
| Beneficiário final | opcional | obrigatório |
| PLD/FTP, PEP, sanções, risco do cliente | opcional | obrigatório |
| Vínculo chave ↔ identidade legal | opcional | obrigatório |
| Ficha de enquadramento por emissão | ausente | obrigatória, bloqueante |
| Dossiê da emissão | ausente | obrigatório |
| Contas individualizadas de titulares | ausente | obrigatório |
| Livros formais de debêntures | ausente | obrigatório |
| Retenção por classe documental | configurável | obrigatória, não contornável |
| Registro externo bloqueante | ausente | condicional ao enquadramento |
| Patrimônio separado isolado | ausente | condicional ao enquadramento |

## 2. Enquadramento da emissão

Toda emissão usa a expressão controlada: "colocação privada, fora do âmbito
das ofertas públicas, conforme classificação jurídica documentada".

Regras:

1. Ausência de publicidade não prova colocação privada por si só.
2. O processo registra destinatários, canais e materiais da colocação.
3. O responsável jurídico aprova o enquadramento antes da emissão.
4. Uma mudança na distribuição permite nova classificação.

## 3. Escrituração e registros nominativos

O caso-base do perfil é: título nominativo, privado, não escritural e fora
do depósito centralizado. Nesse caso, a companhia mantém seus registros
nominativos na plataforma própria.

Regras:

1. A plataforma não se apresenta como serviço regulado de escrituração.
2. A escritura declara a forma adotada: nominativa não escritural ou
   escritural.
3. Forma escritural, oferta pública ou depósito centralizado mudam o
   resultado. Nesses casos, a plataforma integra e reconcilia a
   infraestrutura autorizada.

## 4. KYC e PLD/FTP

O perfil torna obrigatórios:

1. KYC, KYB e verificação de identidade.
2. Validação dos poderes de administradores, procuradores e representantes.
3. Identificação e atualização do beneficiário final.
4. Avaliação de risco, PEP, sanções e jurisdições de risco.
5. Registro da origem da evidência e da decisão de onboarding.
6. Monitoramento transacional e tratamento de alertas.
7. Bloqueios, revisões periódicas e trilha das decisões de compliance.

```typescript
interface KycRecord {
  kyc_id: Ulid;
  subject_legal_identity_id: Ulid;
  kind: 'kyc' | 'kyb';
  identity_evidence_ids: Ulid[];
  beneficial_owners: Ulid[];       // identidades dos beneficiários finais
  pep_status: 'no' | 'yes' | 'under_review';
  sanctions_checked_at: number;
  risk_rating: 'low' | 'medium' | 'high';
  onboarding_decision: 'approved' | 'rejected' | 'escalated';
  decision_reason: string;
  alerts: Ulid[];                  // alertas de monitoramento
  next_review_at: number;          // revisão periódica
  decided_by: string;
  decided_at: number;
}
```

Sem `KycRecord` aprovado, nenhuma conta de titular é aberta. Ver
`docs-v2/perfil-securitizacao/titularidade-e-movimentacao.md`.

## 5. Componentes do perfil

- [Ficha de enquadramento](ficha-de-enquadramento.md)
- [Dossiê da emissão e livros formais](dossie-e-livros.md)
- [Titularidade e movimentação](titularidade-e-movimentacao.md)
- [Gravames, bloqueios e eventos financeiros](gravames-e-eventos.md)
- [Patrimônio separado](patrimonio-separado.md)
- [Registro externo](registro-externo.md)
- [Retenção e privacidade](retencao-e-privacidade.md)

## 6. Critérios de aceite do perfil

1. Cada emissão tem enquadramento aprovado e versionado.
2. A colocação registra destinatários e materiais.
3. A forma nominativa ou escritural está explícita.
4. KYC e PLD/FTP são obrigatórios.
5. Cada assinatura relevante tem vínculo legal e temporal.
6. O ledger oficial é append-only e integral.
