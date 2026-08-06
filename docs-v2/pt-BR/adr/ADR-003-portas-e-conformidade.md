---
id: adr-003-portas-e-conformidade
tipo: adr
status: aceito
data: 2026-08-02
fontes:
  - sessão de grilling arquitetural 2026-08-02
  - docs-v2/pt-BR/adr/ADR-002-tres-produtos-independentes.md
---

# ADR-003 — Armazenamento e rede ficam atrás de portas com suíte de conformidade

## Decisão

Armazenamento e rede são acessados exclusivamente por portas declaradas em
**Contratos**. Cada porta vem acompanhada de uma suíte de conformidade: um
conjunto de vetores executáveis que qualquer implementação precisa passar para
se declarar conforme. **Avelino** fornece as implementações de referência
(SQLite para armazenamento; in-memory, WebSocket e WebRTC para rede). Nenhuma
delas é privilegiada pelo contrato.

Isto resolve a sobreposição entre Avelino e Contratos: **Contratos possui o
contrato e a prova; Avelino possui a implementação.** "Definição rígida"
significa contrato rígido e verificável, não implementação única.

## Motivo

A troca de rede já é requisito exercido: o primeiro anel da estratégia de teste
é simulação determinística, que exige adapter em memória. A troca de
armazenamento foi mantida por decisão explícita, aceitando o custo da abstração
em favor de não fixar SQLite no contrato.

## Consequências

- Existir uma segunda implementação não é pré-requisito para a porta existir,
  mas a suíte de conformidade é obrigatória desde a primeira — sem ela, "porta"
  é só indireção sem garantia.
- A implementação de referência não pode ser a definição do comportamento. Se a
  suíte não cobre um comportamento, ele não é contrato.
- O esquema do grafo append-only é normativo em Contratos (forma e invariantes);
  o DDL SQLite é detalhe da implementação de referência em Avelino.
