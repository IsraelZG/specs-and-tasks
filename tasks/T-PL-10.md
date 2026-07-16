---
id: T-PL-10
title: "SPIKE: Lightpanda como engine de automação web"
status: draft:triaged
complexity: 5
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PL-09"]
blocks: []
capacity_target: opus-spike
---

# T-PL-10 · SPIKE: Lightpanda como engine de automação web

## 0. Ambiente de Execução Obrigatório
- **Código observado:** `C:\Dev2026\superapp`, após T-PL-09 integrada.
- **Runtimes:** Linux amd64 em container e Windows via WSL2; Chromium instalado como fallback.
- **Capacidade-alvo:** `opus-spike`; entregável = bancada reproduzível, matriz de compatibilidade e veredito. Não altera o plugin de produção.
- **PoC descartável:** `C:\tmp\t-pl-10-lightpanda`; não commitar binários, perfis, páginas externas ou credenciais.

## 1. Objetivo
Determinar se o Lightpanda pode ser uma engine **opcional** do adapter `agent-browser` para automação de leitura/DOM e scraping sem fidelidade visual. Medir o ganho líquido contra Chromium no contrato de capacidades de T-PL-09 e decidir entre `NO-GO`, suporte experimental com fallback por domínio ou task de integração. Esta task não pressupõe substituir Chromium.

## 2. Contexto RAG
- `tasks/T-PL-09.md` — adapter, sessão efêmera, allowlist e política de ações que esta spike não pode contornar.
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` §6 — capacidade concedida, privacidade e sandbox.
- [Lightpanda README](https://github.com/lightpanda-io/browser) — browser headless Zig, CDP e limites atuais.
- [Lightpanda BENCHMARKS.md](https://github.com/lightpanda-io/demo/blob/main/BENCHMARKS.md) — metodologia do fornecedor; hipótese, nunca evidência do SuperApp.
- [agent-browser CHANGELOG](https://github.com/vercel-labs/agent-browser/blob/main/CHANGELOG.md) — suporte upstream a `--engine lightpanda`; usar o pin já auditado em T-PL-09.

## 3. Matriz Obrigatória
1. Reproduzir o fluxo permitido por T-PL-09: `open → snapshot --json → click por ref → snapshot`, com fixture local e allowlist.
2. Medir Chromium e Lightpanda nas mesmas páginas: fixture estática, formulário simples, domínio bloqueado e página com JavaScript moderado.
3. Registrar p50/p95 de início de sessão, `open`, snapshot e ação por ref; RSS/pico, CPU e taxa de falha em >=30 repetições após warm-up.
4. Testar APIs não suportadas, login, download/upload, WebSocket e renderização visual; cada caso deve resultar em fallback explícito ou negação clara.
5. Confirmar operação WSL2/container no Windows alvo e registrar imagem, versão, SHA e rede. Ausência de binário Windows nativo é resultado, não contorno.
6. Executar smoke de segurança: allowlist, ação negada, perfil efêmero e logs sem cookies/headers/credenciais, nas duas engines.

## 4. Critérios de Evidência e Decisão
- Mesmo contrato de capacidade, versão de `agent-browser`, página e política de ações para as duas engines.
- Números 9×/16× do fornecedor não contam como evidência.
- `GO experimental` exige >=2× no p95 do fluxo DOM **ou** >=50% menos pico de memória, compatibilidade >=95% no corpus permitido e fallback Chromium comprovado.
- `NO-GO` se compatibilidade/fallback não forem determinísticos, se o ganho não superar WSL2/container ou se AGPL inviabilizar a distribuição.
- Testes visuais, screenshots, layout, fontes e acessibilidade renderizada permanecem em Chromium: Lightpanda não tem motor gráfico.

## 5. Não Fazer / Pegadinhas
- **NÃO** substituir Playwright/Chromium, expor CDP à rede ou usar sites/credenciais reais.
- **NÃO** relaxar allowlist, CSP, sandbox, ação permitida ou sessão efêmera para fazer uma página passar.
- **NÃO** alegar compatibilidade Playwright completa; o upstream declara suporte parcial e beta.
- Registrar AGPL-3.0, modo de distribuição e obrigação aplicável antes de propor produção.

## 6. Feedback de Especificação
Reendurecer após T-PL-09 `done`, fixando interface do adapter, versão/binário do Lightpanda e comandos reais. Uma integração posterior adiciona seleção de engine ao adapter existente; não cria outro sidecar nem ignora o manifesto de capacidades.

## 7. Definition of Done
- [ ] Harness reproduzível sem credenciais e matriz Chromium × Lightpanda com dados brutos.
- [ ] Compatibilidade, p50/p95, memória, falhas, segurança e fallback documentados.
- [ ] Parecer de licença/distribuição anexado.
- [ ] Veredito `NO-GO | experimental com fallback | task de integração`, com gatilho de reavaliação.

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-16T14:21]** - *gpt-5* - `[Triado]`: Spike Lightpanda triada; aguarda o contrato do adapter T-PL-09.
