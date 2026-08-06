---
id: dossie-e-livros
tipo: dominio
status: ativo
perfil: corporate-regulated/securitization
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seções 11.2 e 11.5)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (seções 4.3 e 12.6)
conceitos:
  - dossie-da-emissao
  - livro-de-registro-de-debentures
  - livro-de-transferencia-de-debentures
---

# Dossiê da emissão e livros formais

## 1. Dossiê da emissão

O dossiê agrupa os documentos societários de uma emissão. Cada documento
tem hash, versão, signatários e estado de retenção.

```typescript
type DossierDocumentKind =
  | 'corporate_act'        // deliberação e atos societários
  | 'indenture'            // escritura de emissão
  | 'amendment'            // aditamento
  | 'publication'          // publicação exigida
  | 'guarantee'            // garantia e sua constituição
  | 'commercial_registry'  // recibo da Junta Comercial
  | 'framing_opinion';     // parecer de enquadramento

interface DossierDocument {
  document_id: Ulid;
  issuance_id: Ulid;
  kind: DossierDocumentKind;
  content_hash: Hash32;
  version: number;
  signer_evidence_ids: Ulid[];   // pacotes de evidência de assinatura
  retention_class_id: string;    // classe documental da retenção
  state: 'draft' | 'signed' | 'filed' | 'published';
  filed_at: number | null;
  registry_receipt: string | null;
}
```

Regras:

1. A emissão exige no mínimo: ato societário, escritura e parecer de
   enquadramento.
2. A escritura declara a forma do título. A forma na escritura e na ficha
   de enquadramento deve coincidir.
3. Um aditamento é um documento novo. Ele não altera a escritura original.
4. Publicações e arquivamentos guardam protocolo e recibo.

## 2. Fechamentos

Um fechamento consolida a posição em uma data-base.

```typescript
interface ClosingStatement {
  closing_id: Ulid;
  issuance_id: Ulid;
  cutoff_date: string;           // data-base ISO 8601
  holder_list_hash: Hash32;      // hash da lista de titulares
  positions_hash: Hash32;        // hash das posições por titular
  prev_closing_hash: Hash32;     // encadeamento dos fechamentos
  generated_at: number;
  signature: Signature;          // assinatura da autoridade
}
```

Regras:

1. O fechamento gera posição por data-base, lista de titulares e extrato
   individual.
2. Cada fechamento é assinado e encadeado ao anterior.
3. A posição histórica é reproduzível a partir do feed. O fechamento é uma
   projeção assinada, não uma fonte nova.

## 3. Livros formais

O perfil gera dois livros por emissão: o Livro de Registro de Debêntures
Nominativas e o Livro de Transferência de Debêntures Nominativas.

```typescript
interface FormalBook {
  book_id: Ulid;
  issuance_id: Ulid;
  kind: 'registration' | 'transfer';
  opening_term_hash: Hash32;     // termo de abertura
  closing_term_hash: Hash32 | null;  // termo de encerramento
  entries_from: Cursor;          // intervalo do feed coberto
  entries_to: Cursor;
  closed_version_hash: Hash32;   // versão fechada
  authentication_receipt: string | null;  // autenticação na Junta
  custody_ref: string;           // custódia do livro
}
```

Regras:

1. Todo livro tem termo de abertura e termo de encerramento.
2. O livro registra autenticação, recibo e versão fechada.
3. Uma dispensa de livro é uma decisão jurídica documentada da emissão.
   Ela nunca é o comportamento padrão do software.
4. O livro é exportado em formato estável e inteligível, independente da
   aplicação.

## 4. Testes de conformidade

1. Uma emissão sem escritura no dossiê não abre contas de titulares.
2. Um fechamento valida contra a posição reconstruída do feed.
3. Um livro sem termo de abertura é inválido.
4. A cadeia de fechamentos detecta qualquer alteração por hash.
