---
id: EST-48a
title: "P0.3a SPIKE: persistência segura de credenciais de provider"
status: done
complexity: 4
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-47"]
blocks: ["EST-48b"]
capacity_target: opus-spike
---

# EST-48a · P0.3a SPIKE: persistência segura de credenciais de provider

## 0. Ambiente de Execução Obrigatório
- **Repos:** `C:\Dev2026\superapp` (PoC) e `C:\Dev2026\Docs` (ADR).
- **Runtime:** Node.js v20+ (mesmo do superapp; *derivado de ADR-0012 §Decisão*).
- **Entregável:** ADR + PoC descartável/reutilizável + contrato `SecretStore`; **não** entrega UI de
  configuração nem integração com chat/perfis (isso é EST-48b).
- **Capacidade-alvo:** opus-spike (exploração de opções crypto + PoC cross-platform).

## 1. Objetivo
Escolher e provar o mecanismo mínimo para persistir API keys do Estaleiro standalone sem gravá-las
em texto puro no SQLite, logs, respostas HTTP, snapshots ou repositório. A solução deve sobreviver
ao restart e ter operações `set/get/delete`, com comportamento explícito quando o cofre não estiver
disponível.

## 2. Contexto RAG (Spec-Driven Development)
- [ADR-0012](../docs/adr/0012-empacotamento-standalone-estaleiro.md) — **fonte absoluta** do
  empacotamento: Node standalone + browser, sem Electron/Tauri. Elimina `keytar`/`safeStorage`
  (Electron-only) como opções viáveis.
- [EST-19](./EST-19.md) — entrypoint standalone (`server.mjs`, `scripts/estaleiro-standalone.mjs`);
  define onde o PoC deve rodar.
- [EST-40](./EST-40.md) — provider atual: `resolveModel()` lê `process.env[apiKeyEnv]` em
  `packages/plugin-providers/src/registry.ts`; `createProviderConfig()` em `factory.ts` com fallback
  `opts?.apiKey ?? process.env[...]`. **Estado atual: chave nunca persistida, só lida do env.**
- [EST-48b](./EST-48b.md) — consumidor do contrato `SecretStore` que esta spike deve fixar.
- `apps/estaleiro/core/src/bootstrap.ts` — composition root atual (better-sqlite3 WAL, tinybase
  in-memory); **não** toca em segredos hoje.
- `packages/plugin-providers/src/registry.ts` — registry de providers com `apiKeyEnv` por provider
  (`DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `OMNIROUTE_API_KEY`).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `docs/adr/0018-provider-secret-storage.md` — ADR com decisão, ameaças, alternativas
  avaliadas, contrato `SecretStore` e plano de migração. *(Número 0018 derivado de: último ADR
  numerado é 0017 em `docs/adr/0017-campanhas-encadeadas-branch-stack.md`.)*
- **[CREATE]** `apps/estaleiro/core/spikes/secret-store/` — PoC mínimo (diretório + arquivos
  conforme ADR). Estrutura exata definida pelo spike; mínimo: um script de prova e um README.
- **[NO CHANGE]** UI, rotas públicas, registry de providers, `bootstrap.ts`, `server.mjs`.

## 4. Estratégia de Testes/Prova (casos enumerados)
> **Framework:** Node test runner (`node --test`) ou `vitest` — o spike decide e registra no ADR.
> **Ambiente:** Node puro no host atual (Windows); registrar limites de Linux/macOS se testados.

### Casos de prova (todos obrigatórios no ADR):
1. **Persistência após restart:** `set("marker-1", <valor>)` → mata processo → reinicia →
   `get("marker-1")` retorna o valor original.
2. **Ausência em storage inseguro:** após `set`, o valor marker **não** aparece em:
   - arquivo `.db` (SQLite principal) — busca por substring binária.
   - arquivo `.db-wal` / `.db-shm` — idem.
   - stdout/stderr capturado do processo (logs).
   - qualquer arquivo JSON servido pela API HTTP.
   - diff do repositório git (`git diff` limpo).
3. **Delete apaga:** `delete("marker-1")` → `get("marker-1")` retorna `undefined`/lança
   `SecretNotFound`.
4. **Cofre indisponível:** simular backend indisponível (permissão negada, path inacessível, etc.) →
   `set`/`get` retornam erro estruturado `SecretStoreUnavailable` (não crash, não valor parcial).
5. **Write-only:** `set("k", v)` não retorna `v`; `get("k")` retorna `v` apenas para o caller
   interno que precisa montar o `LanguageModel` — a API HTTP de perfis (EST-48b) **nunca** expõe o
   valor.
6. **Anti-fake:** o PoC importa/usa o backend escolhido (não uma simulação com `Map`); o caso 2
   (ausência em storage) reprova implementação que usa `Map` ou SQLite em claro.
7. **Cross-platform (se aplicável):** registrar explicitamente quais SOs o backend suporta no
   ambiente atual (Windows obrigatório; Linux/macOS desejável).

## 5. Instruções de Execução (Step-by-Step)
> **NÃO FAZER:**
> - NÃO decidir por "base64", hash reversível, chave fixa no código ou criptografia com chave no
>   mesmo DB. *(Derivado de: ameaça trivial — chave no mesmo storage = criptografia sem segredo.)*
> - NÃO adicionar `keytar`/Electron/daemon sem confirmar compatibilidade com ADR-0012. *(Derivado
>   de: ADR-0012 §Decisão — Node standalone, zero desktop framework.)*
> - NÃO colocar segredo real no PoC; usar marker sintético (ex.: `sk-spike-<uuid>`).
> - NÃO implementar integração com chat, perfis ou UI — isso é EST-48b.

1. **Ler ADR-0012** e listar os ambientes realmente suportados hoje (Node standalone + browser em
   Windows; Linux/macOS se o build do standalone cobrir).
2. **Avaliar no mínimo** as alternativas abaixo (critérios: segurança, complexidade, dependência
   externa, cross-platform, sobrevivência a restart):
   - **A.** Arquivo cifrado (`node:crypto` AES-256-GCM) com chave mestra de `process.env` ou
     keyfile externo.
   - **B.** SQLite cifrado (SQLCipher / `better-sqlite3` com extensão de criptografia).
   - **C.** Credencial do SO via módulo nativo Node (ex.: `wincred`/`libsecret`/`keychain`) —
     avaliar disponibilidade e manutenção.
   - **D.** Manutenção via env (`.env` file com permissões restritas, zero persistência em DB).
   - Spike pode adicionar alternativa se justificada.
3. **Provar a opção recomendada** no ambiente atual (casos §4 todos verdes).
4. **Gravar no ADR-0018:**
   - Decisão + justificativa.
   - Ameaças modeladas (onde o segredo **não** pode aparecer).
   - Alternativas rejeitadas com evidência.
   - **Contrato `SecretStore`** (seção dedicada) — tipos TS exatos que EST-48b implementa.
   - Plano de migração do `DEEPSEEK_API_KEY` atual (env → novo backend).

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões que o spike DEVE fechar** (não são gaps da spec — são o entregável):
> - Backend de segredo escolhido e fallback permitido quando indisponível.
> - Escopo do segredo (por máquina / por usuário / por workspace).
> - Forma de referenciar o segredo no perfil persistido (EST-48b) sem retornar seu valor.
> - Migração do `DEEPSEEK_API_KEY` atual e política de delete/rotação.
>
> **Nenhum destes itens é um gap que bloqueia o endurecimento** — a task é um spike e estas são as
> perguntas que o spike responde. Se o spike não conseguir responder uma delas, o ADR registra como
> decisão pendente e EST-48b herda a abertura.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
O Worker deve colar a saída literal destes comandos na Seção 8 (Handover), rodados na raiz do
`superapp`:
```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
```
Todos devem retornar Exit Code 0. *(Escopo: pacote do spike; não há mudança em outros pacotes.)*

### Checklist do Reviewer
- [ ] ADR-0018 escolhe uma opção e rejeita as demais com evidência (não opinião)?
- [ ] PoC prova persistência após restart (caso 4.1)?
- [ ] PoC prova ausência do marker em SQLite/WAL/logs/JSON/git (caso 4.2)?
- [ ] Contrato `SecretStore` no ADR tem tipos TS exatos (zero `any`/`unknown` vago)?
- [ ] Caso anti-fake (4.6) reprovaria implementação sem o backend real?
- [ ] Nenhuma credencial real foi usada ou registrada no PoC/ADR?
- [ ] `pnpm --filter @plataforma/estaleiro-core build && test && lint` passam (Exit Code 0)?

## 8. Log de Handover e Revisão
### Handover do Executor:

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-16T13:25]** - *gpt-5* - `[Triado]`: triagem P0.3a: spike obrigatório para fechar armazenamento seguro de credenciais
- **[2026-07-16]** - *claude-opus* - `[Endurecido]`: spec endurecida → draft:hardened; ADR-0018, casos enumerados, contrato SecretStore derivado de EST-48b, gate scoped a @plataforma/estaleiro-core
- **[2026-07-16T17:16]** - *claude-opus* - `[Reconciliado]`: status restaurado de draft:hardened para draft:triaged (drift corrigido)
- **[2026-07-16T17:17]** - *claude-opus* - `[Endurecido]`: endureceu spec: ADR-0018, casos enumerados, contrato SecretStore derivado de EST-48b, gate scoped
- **[2026-07-16T19:09]** - *deepseek* - `[Promovida p/ ready]`: draft:hardened com deps done — safety-net flip
- **[2026-07-16T20:00]** - *gpt-5* - `[Reconciliado]`: status restaurado de ready para done (drift corrigido)
