# Referências locais de código aberto

> **Uso:** material de leitura para endurecimento e execução de tasks. As cópias em `docs/_vendor/`
> são clones rasos, ignorados pelo Git; este manifesto, URL e commit permitem recriá-las. Referência
> de código não significa autorização para copiar: cada task ainda verifica licença e compatibilidade.

| Repositório | Clone local ignorado | Commit fixado | Arquivos de interesse inicial |
| --- | --- | --- | --- |
| [Cognee](https://github.com/topoteretes/cognee) | `docs/_vendor/cognee` | `423fd0d6b5ef1de6280e77ebc82ffce9bd6c215a` | `cognee/memify_pipelines/`, `examples/demos/memory_provenance_demo.py` |
| [Collective Intelligence](https://github.com/ailinone/collective-intelligence) | `docs/_vendor/collective-intelligence` | `70c0ee2bf994b89b15c4bd809ca7788dff452070` | `api/src/core/orchestration/orchestration-engine.ts`, `strategy-tiers.ts`, `verification/answer-check-resolver.ts` |
| [Dashi PPT Skill](https://github.com/chuspeeism/dashi-ppt-skill) | `docs/_vendor/dashi-ppt-skill` | `ff3a7330e4967147a40310669703b911fb1f708a` | `SKILL.md`, catálogo/layouts e scripts de validação |
| [Archify](https://github.com/tt-a1i/archify) | `docs/_vendor/archify` | `6d5204d23dfa2cbf3dfff423beeb32250a3dc727` | `README.md` e implementação do IR/render local |
| [OpenZL](https://github.com/facebook/openzl) | `docs/_vendor/openzl` | `7f97c9807828545232cdf23da5d8afe4c7c744ff` | `examples/training.cpp`, `src/openzl/` |
| [Lightpanda](https://github.com/lightpanda-io/browser) | `docs/_vendor/lightpanda-browser` | `90db5d7f698636196502aea377475b94f601efee` | `README.md`, implementação CDP/browser em Zig |
| [DocuSeal](https://github.com/IsraelZG/docuseal) | `docs/_vendor/docuseal` | `6a3a18531021a20ea2b02c146a918a4e127971ce` | `README.md`, API/webhooks e componentes de assinatura |
| [BiGain](https://github.com/Greenoso/BiGain) | `docs/_vendor/bigain` | `e3a964b89c13908b5a3bc4f66beb4f2514766021` | `README.md` e scripts de redução de tokens de difusão |
| [Serena](https://github.com/oraios/serena) | `docs/_vendor/serena` | `2c10e25c979da2c39ce8d5ac98c7e6dbd3c065cf` | `src/`, tools de símbolos/LSP e testes de retrieval |
| [LLMLingua](https://github.com/microsoft/LLMLingua) | `docs/_vendor/llmlingua` | `e0e9d99beb94098bbd924aa53c2c112eac41c758` | `llmlingua/prompt_compressor.py`, `tests/test_llmlingua2.py` |
| [tree-sitter](https://github.com/tree-sitter/tree-sitter) | `docs/_vendor/tree-sitter` | `0a0e77c375ba24ab8f4a49a389f51850a30a14a1` | `lib/`, bindings e parser incremental |
| [Headroom](https://github.com/chopratejas/headroom) | `docs/_vendor/headroom-upstream` | `961866ba7c277b59ccdd51e784de9547a09198af` | `tests/test_ccr_batch_processor.py`, `tests/test_compression_decision.py` |

## Regra de leitura

Antes de adaptar código externo, a task registra no handover: caminho local lido, commit acima,
licença observada, parte absorvida e por que uma implementação própria preserva o contrato da ADR
0019. Para projetos AGPL ou sem licença adequada, usar comportamento/algoritmo como inspiração e
nunca copiar implementação para o produto.
