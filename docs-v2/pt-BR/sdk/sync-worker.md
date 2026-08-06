---
id: sync-worker
tipo: sdk
status: ativo
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 7)
  - docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md (base herdada)
substitui:
  - docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md
  - docs/conceitos/sync-worker.md
conceitos:
  - sync-worker
  - outbox
---

# Sync Worker e ciclo de vida

O Sync Worker é o worker central de dados do cliente. Ele persiste no
SQLite, aplica o change feed, gerencia a outbox e orquestra o Automerge
Repo. A organização em Sync Worker, Crypto Worker e Index Worker permanece.

## 1. Responsabilidades

1. Autenticar a autoridade e manter a sessão do feed.
2. Aplicar lotes do change feed em transações únicas.
3. Escolher a fonte de cada registro: autoridade ou peer autorizado.
4. Validar hash, assinatura e permissão de cada registro.
5. Gerenciar a outbox durável de propostas.
6. Orquestrar o Automerge Repo para documentos colaborativos.
7. Executar as regras de domínio declaradas nas `SPECIFICATION`s.

## 2. Loop de sincronização

1. O worker envia o último cursor aplicado por partição.
2. O worker recebe o próximo manifesto.
3. O worker valida o manifesto e o encadeamento.
4. O worker baixa os registros das fontes escolhidas.
5. O worker valida cada registro.
6. O worker grava o lote em uma transação e avança o cursor.
7. O worker pede lacunas à autoridade.

O anti-entropy por fingerprint deixa de ser o caminho normal. O cursor
monotônico da partição é a prova de posição. O worker pode usar comparação
de hash de estado como verificação auxiliar de auditoria.

## 3. Envio de propostas

1. O worker lê propostas `pending` da outbox em ordem de criação.
2. O worker envia cada proposta pelo canal `FEED_SYNC`.
3. Em `confirmed`, o worker marca a proposta e aguarda o registro no feed.
4. Em `rejected`, o worker registra o motivo e remove a proposta da fila.
5. Em timeout, o worker reenvia. O `proposal_id` garante idempotência.

## 4. Ondas de carregamento

As ondas permanecem como priorização de leitura. Elas agora consomem o feed.

| Onda | Conteúdo | Bloqueio |
| :--- | :--- | :--- |
| 0 | identidade, permissões, especificações | abertura da UI |
| 1 | domínios prioritários e saldos quentes | tela ativa |
| 2 | histórico em background, estado podado | nenhum |
| 3 | reidratação sob demanda | contexto de visualização |

## 5. Operação offline

1. O worker mantém leitura do cache local.
2. O worker aceita edições e grava propostas na outbox.
3. O worker troca com peers registros cobertos por manifestos conhecidos.
4. O worker sinaliza na interface que os dados podem estar desatualizados.

## 6. Memória e coleta de lixo

O ciclo de vida de memória herdado permanece: cache parcial na UI, TTL de 4
horas para chaves de época em RAM e coleta de lixo com pools separados. A
poda local segue a política de réplica (ver
`docs-v2/sdk/sqlite-schema.md`). O estado intermediário `compressed`
permanece entre `integral` e `pruned_replica`.

## 7. Multi-aba

A pilha de workers tem um dono por origem. O caminho preferencial usa
SharedWorker. O fallback usa Web Locks. Abas seguidoras não abrem conexões
próprias de sync.

## 8. Testes de conformidade

1. Dois clients com o mesmo cursor convergem após o mesmo lote.
2. Uma proposta sobrevive ao fechamento do app e é enviada no retorno.
3. Um lote inválido aborta a transação sem avançar o cursor.
4. O worker exibe o indicador de dados possivelmente desatualizados quando
   a autoridade está inalcançável.
5. Um registro recebido de peer sem manifesto correspondente não é
   aplicado.
