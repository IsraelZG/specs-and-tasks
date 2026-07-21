---
id: T-CMP-02
title: "Pack de linhagem cifrada no Crypto Worker"
status: draft:triaged
complexity: 4
target_agent: crypto_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-313a", "T-313c", "T-CMP-01"]
blocks: []
capacity_target: sonnet
---

# T-CMP-02 · Pack de linhagem cifrada no Crypto Worker

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp`; confirmar a implementação atual de Crypto Worker, retenção e Archive Cargo.
- **Runtime:** browser worker/Node conforme os ports existentes; TypeScript; `pnpm`; Vitest.
- **Capacidade-alvo:** sonnet; triagem inicial, aguarda benchmark de codec e paths reais.

## 1. Objetivo
Implementar o degrau `compressed` de linhagem fria: no Crypto Worker autorizado, decifrar N versões, aplicar transformação reversível/delta encoding, comprimir com codec aprovado por T-CMP-01 e recifrar um pack AEAD. Heads vigentes permanecem integrais; o pack é recuperável como unidade fria e não expõe plaintext à UI ou filesystem.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §7.
- [caderno SDK/02](../docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md) §4.1 — `integral → compressed → pruned` e regras de pack.
- [T-313a](./T-313a.md) e [T-313c](./T-313c.md) — archive zstd + AES-GCM, storage/GC existentes.
- [T-CMP-01](./T-CMP-01.md) — decisão medida de codec por corpus.

## 3. Escopo a endurecer
- **[READ]** Crypto Worker, persistência de payload/retention state e Archive Cargo atuais.
- **[CREATE/UPDATE]** Tool de pack/unpack de linhagem e transição de retenção no pacote confirmado.
- **[CREATE]** testes de roundtrip bytewise, integridade e exclusão de head vigente.

## 4. Casos obrigatórios no endurecimento
1. Ciphertext de entrada não é passado diretamente ao compressor; plaintext só existe no Crypto Worker autorizado.
2. N versões compactadas restauram bytes históricos assinados exatamente, sem reserialização/reassinatura.
3. Head vigente não entra no pack e permanece recuperável sem descompactação global.
4. Hash do ciphertext e tag AEAD inválidos impedem decifração/descompressão.
5. `ASSET:PIN`, retenção obrigatória e estado de bateria impedem compactação proibida.
6. Tentativa de acessar pack sem chave/autorização não devolve plaintext nem metadado sensível.

## 5. Não fazer
- Não comprimir ciphertext.
- Não trocar gzip/zstd de wire/bootstrap fora de decisão de T-CMP-01.
- Não usar pack como canal interativo.
- Não manter cópia de plaintext em UI, arquivo temporário ou processo externo.

## 6. Feedback de Especificação
A cadeia criptográfica e os invariantes estão fechados. Codec e paths concretos dependem do veredito de T-CMP-01 e da leitura da implementação atual; reendurecer então.

## 7. Gate futuro
Fixar build/test/lint dos pacotes donos e testes de roundtrip/integridade/retention no endurecimento JIT.

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-
### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triado pack de linhagem cifrada; aguarda benchmark de codec.
