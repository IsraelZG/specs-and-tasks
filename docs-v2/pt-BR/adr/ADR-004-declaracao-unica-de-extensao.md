---
id: adr-004-declaracao-unica-de-extensao
tipo: adr
status: aceito
data: 2026-08-02
fontes:
  - sessão de grilling arquitetural 2026-08-02
  - docs-v2/pt-BR/adr/ADR-002-tres-produtos-independentes.md
---

# ADR-004 — Módulo, plugin e conector são uma declaração única com três `kind`

## Decisão

Contratos define **uma** declaração de extensão. O miolo é comum: identidade,
versão, capacidades declaradas, permissões exigidas, comandos oferecidos,
ativação e revogação. Um discriminador `kind` acrescenta o que é específico:

| `kind` | Acrescenta |
| :--- | :--- |
| `modulo` | lente sobre o grafo, páginas, comandos de domínio |
| `plugin` | referência a bundle assinado, sandbox e limites de execução |
| `conector` | classe A–E e evidência por chamada |

O termo discriminador é `kind`, não "perfil". "Perfil" já designa o tipo de nó
`PROFILE` (quem age) e o perfil regulatório (`corporate-regulated/…`).

## Por que "declaração" e não "manifesto"

*Manifesto* já nomeia o lote assinado pela autoridade, que prova completude e
posição no feed. Esse é o sentido literal da palavra — a lista de conteúdo de
uma carga — e está em sete documentos normativos. A extensão, portanto, tem uma
**declaração**. Uma palavra, um sentido.

## Invariante de execução

`kind: modulo` **não possui campo de bundle**. Uma declaração de módulo declara
e habilita; ela nunca carrega nem autoriza código. Código executável entra
exclusivamente por `kind: plugin` ou `kind: conector`, sempre por bundle
assinado. Instalação de código, ativação da extensão e concessão de capacidades
são três atos distintos e separadamente revogáveis.

Sem este invariante, um documento do grafo se tornaria vetor de execução
arbitrária.

## Motivo

Os três mecanismos divergem no que fazem e convergem no que precisam ser
governados: identidade, capacidade, ativação e revogação. Três contratos
significariam três caminhos de revogação para auditar. Revogação é o teste que
distingue uma fronteira real de uma fronteira decorativa — ela precisa ser um
caminho só.

## Consequências

- A suíte de conformidade de extensão exercita a declaração comum uma vez e cada
  `kind` uma vez.
- O conector é o único `kind` com contrato já escrito no v2 (classes A–E e
  `ConnectorCallEvidence`). Ele é a referência de maturidade para os outros dois.
- Módulo e plugin não têm nenhuma especificação no v2 hoje. Ambos precisam ser
  escritos no registro do v2, não portados do corpus antigo.
