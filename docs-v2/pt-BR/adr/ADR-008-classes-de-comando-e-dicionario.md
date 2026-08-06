---
id: adr-008-classes-de-comando-e-dicionario
tipo: adr
status: aceito
data: 2026-08-02
fontes:
  - sessão de grilling arquitetural 2026-08-02
  - docs-v2/pt-BR/adr/ADR-007-superficie-de-comandos-ai-first.md
  - docs/caderno-4-governance/02b-modulos-profiles-mensageria.md (§2, absorvido)
---

# ADR-008 — Três classes de comando e um dicionário composto por modo

## Decisão

Todo comando declara uma classe, que define o tempo de vida do seu efeito e,
por consequência, quem o trata:

| Classe | Efeito | Tratado por |
| :--- | :--- | :--- |
| `local` | tabela local do dispositivo; sobrevive à sessão; nunca replica | Marilda |
| `efemero` | não persiste em lugar nenhum; só alcança quem escuta agora | quem estiver escutando |
| `duravel` | proposta → autoridade → registro assinado no grafo | Avelino |

Nem todo comando é durável. Trocar o filtro de uma lista, ordenar uma coluna ou
abrir uma aba não vira nó no grafo — vira linha em tabela local.

## Dicionário composto

O dicionário de comandos não é um catálogo central. Ele é a **união do que está
presente naquele modo de implantação**, montada a partir das declarações de
extensão ativas:

- Em modo web, desktop ou mobile, Marilda intermedeia o dicionário. Ela responde
  aos comandos `local` e `efemero` e encaminha os `duravel` a Avelino.
- Em modo cloud não há Marilda. O dicionário é o de Avelino e dos módulos, e
  comandos `local` simplesmente não existem ali.

Um agente lê o dicionário do modo em que está e descobre o que pode fazer.

## Vocabulário aposentado

- **`CONTENT:INTENT` como conceito.** Um comando `duravel` produz uma
  **proposta**; confirmada, ela é um **registro**. Não há terceiro nome para a
  mesma coisa em outro momento do ciclo.
- **Sinal de coordenação e seu registry próprio.** Um sinal é um comando
  `efemero`, declarado no mesmo dicionário e sujeito à mesma verificação de
  capacidade. O registry separado descrito no corpus antigo deixa de existir.

## Consequências

- A classe é declarada, não inferida: o chamador sabe antes de invocar se a ação
  deixa rastro auditável.
- Um comando `local` não tem autoria nem assinatura, porque não é fato. Um
  comando `duravel` registra o autor efetivo — persona do usuário ou delegado do
  módulo agindo por automação.
- A mesma ação nunca existe em duas classes. Se precisa virar fato, é `duravel`
  desde a declaração.
