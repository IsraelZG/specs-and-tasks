---
id: adr-006-avelino-isomorfico-e-motor-unico
tipo: adr
status: aceito
data: 2026-08-02
fontes:
  - sessão de grilling arquitetural 2026-08-02
  - docs-v2/pt-BR/adr/ADR-001-autoridade-logica.md
---

# ADR-006 — Avelino é isomórfico e concentra todo o motor de lógica

## Decisão

Avelino roda idêntico em browser, Node e runtime empacotado (Electron,
Capacitor). Ele não é um servidor; ser servidor é um dos seus modos de
implantação.

| Modo | Composição |
| :--- | :--- |
| web | Marilda + Avelino no browser |
| desktop / mobile | Marilda + Avelino no runtime empacotado |
| cloud | Avelino em Node, sem Marilda; quando há UI, envia-se um bundle Marilda + Avelino ao cliente |

Existe um único motor de avaliação, o Zen Engine, e ele vive em Avelino.

> **Emenda de 2026-08-03 (ADR-014).** A redação original dizia que "Marilda não
> avalia regra alguma, nem de apresentação". Isso estava errado: uma engine de
> planilha é uma engine de aritmética, e a proibição inviabilizava a própria
> planilha. Marilda **computa** — na camada de vista, livremente — e **invoca**
> o motor único pela porta de regra. O que ela não faz é decidir: o veredito que
> vira registro é sempre o da autoridade. Ver ADR-014.

## Motivo

Avelino e Marilda são vizinhos de processo na maioria dos modos: uma chamada
entre eles é in-process, não ida e volta de rede. Não existe, portanto, a
penalidade de latência que normalmente justifica duplicar um avaliador no lado
da interface. Um motor só, num lugar só, sem par para manter sincronizado.

## Autoridade não é o mesmo que Avelino

Avelino rodando no cliente avalia regras; ele não confirma registros. A
autoridade lógica continua sendo o único emissor de confirmação, conforme
ADR-001. Um veredito produzido por uma instância cliente de Avelino é
provisório até a confirmação da autoridade. Instância e papel são coisas
distintas: o mesmo produto, em posições diferentes, tem poderes diferentes.

## Consequências

- Contratos permanece sem código de avaliação: declara contratos e suítes de
  conformidade, não motores. A porta de regra é declarada lá; o motor é de
  Avelino.
- A porta de regra é síncrona e in-process, porque Marilda nunca existe sem um
  Avelino local — ver a tabela de modos acima.

> **Emenda de 2026-08-03 (ADR-014).** Duas consequências originais caíram: "não
> há orçamento de expressão do lado da interface" e "a porta de leitura entrega
> dados já decididos". A porta de leitura entrega dado dentro do limite da
> permissão; Marilda cozinha a partir dele.
