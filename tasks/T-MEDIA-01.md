---
id: T-MEDIA-01
title: "SPIKE: elegibilidade do BiGain para inferência local"
status: blocked
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: []
blocks: []
capacity_target: opus-spike
---

# T-MEDIA-01 · SPIKE: elegibilidade do BiGain para inferência local

## 0. Estado Inicial
**Esta task deve ser bloqueada pelo serviço MGTIA imediatamente após sua criação.** O bloqueio preserva a hipótese sem autorizar adoção, PoC ou integração até que os pré-requisitos externos tenham evidência.

## 1. Objetivo
Manter rastreável a hipótese de que BiGain possa reduzir custo de inferência de um futuro modelo local de difusão para imagem/vídeo. A task só será desbloqueada para experimento quando houver workload real do SuperApp, licença verificável e modelo/hardware-alvo definidos.

## 2. Contexto RAG
- `tasks/T-WASM-02.md` — cobre embeddings e SLM/classificador, não difusão; seus resultados não valem automaticamente para mídia.
- `docs/adr/0011-infra-de-inferencia-local.md` — acelerador só se justifica por workload real; CPU já basta para compressão de contexto.
- [BiGain paper](https://arxiv.org/abs/2603.12240) — token merging e KV downsampling training-free em difusão.
- [BiGain upstream](https://github.com/Greenoso/BiGain) — implementação de pesquisa a auditar no desbloqueio.

## 3. Condições Obrigatórias para Desbloqueio
1. Capability aprovada de geração local de imagem/vídeo, com modelo, consumidor, hardware-alvo, SLO e orçamento de VRAM/latência.
2. Licença explícita e compatível do repositório **e** de todos os pesos/modelos; código público sem licença clara não autoriza uso.
3. Commit/release auditável, ambiente reproduzível e baseline compatível; dependências de pesquisa fixadas no spike.
4. Experimento baseline do mesmo modelo × BiGain no mesmo hardware, com qualidade, latência, memória/VRAM, estabilidade e custo de integração.

## 4. Escopo quando Desbloqueada
- Criar somente PoC descartável em `C:\tmp\t-media-01-bigain`.
- Medir pelo menos dois níveis de compressão e métricas de qualidade do modelo, throughput, latência, VRAM e falhas.
- Distinguir hidden-state token merging/KV downsampling de alegações simplistas sobre “pixels redundantes”.
- Entregar `NO-GO | monitorar | task de integração` sem alterar runtime, modelos ou UI do SuperApp.

## 5. Não Fazer / Pegadinhas
- **NÃO** desbloquear por interesse genérico em IA; exige as quatro condições da seção 3.
- **NÃO** copiar código, pesos ou dependências sem licença explícita compatível.
- **NÃO** prometer economia de VRAM ou qualidade preservada fora do modelo/dataset/hardware medidos.
- **NÃO** criar serviço de mídia, pipeline de PPT, endpoint ou integração Wasm nesta task.

## 6. Definition of Done (após desbloqueio)
- [ ] Pré-requisitos e licença documentados.
- [ ] Bench reproduzível baseline × BiGain com qualidade, latência e VRAM.
- [ ] Veredito com limiar quantitativo e custo operacional.
- [ ] Nenhuma mudança de produção sem task posterior aprovada.

## 7. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-16T14:21]** - *gpt-5* - `[Bloqueado]`: Bloqueada por ausência de workload local de difusão, licença upstream explícita e modelo/hardware-alvo; condições de desbloqueio na seção 3.
