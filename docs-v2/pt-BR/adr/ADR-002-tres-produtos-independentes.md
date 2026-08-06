---
id: adr-002-tres-produtos-independentes
tipo: adr
status: aceito
data: 2026-08-02
fontes:
  - sessão de grilling arquitetural 2026-08-02
---

# ADR-002 — Núcleo, experiência e contratos são três produtos independentes

## Decisão

O sistema é especificado como três produtos versionáveis de forma independente,
adotáveis separadamente inclusive por terceiros: **Avelino** (núcleo),
**Marilda** (camada de experiência) e **Contratos** (contratos e pontos de
extensão). Avelino e Marilda dependem de Contratos. Contratos não
depende de nenhum dos dois. Avelino e Marilda não podem depender um do outro,
em nenhuma direção.

## Motivo

Uma fronteira arquitetural declarada só em prosa apodrece. O repositório tem a
evidência: `docs/visao-arquitetural.md` continua se declarando "descrição
canônica" enquanto o ADR-001 já substituiu suas seções de sincronização, e três
documentos ainda encaminham leitores para ele. Ao tornar cada fronteira uma
fronteira de produto, a violação passa a quebrar o build em vez de exigir que
alguém releia um documento.

## Alternativas consideradas

- **Um produto com três fronteiras internas.** Rejeitada. É exatamente o regime
  em que a fronteira vira prosa e apodrece.
- **Avelino e Contratos como um só produto, Marilda separada.** Rejeitada. Um
  pacote de contratos que também traz implementação de referência adquire as
  dependências dessa implementação e deixa de ser um ápice sem dependências.

## Consequências

- Contratos carrega a suíte de conformidade: é o que permite uma implementação de
  terceiro provar que atende ao contrato.
- Marilda precisa ser especificada sem qualquer referência ao armazenamento ou
  ao transporte de Avelino. Vincula-se a contratos, não ao núcleo.
- Passa a existir uma matriz de compatibilidade entre versões dos três produtos.
- `@plataforma/*` é herança do projeto anterior, não decisão deste repositório.
  O namespace segue em aberto.
