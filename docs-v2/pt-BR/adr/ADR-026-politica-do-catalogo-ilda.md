---
id: adr-026-politica-do-catalogo-ilda
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling 2026-08-03
  - docs-v2/pt-BR/adr/ADR-012-ilda-catalogo-de-modulos.md
  - docs-v2/pt-BR/adr/ADR-021-portao-de-asset-em-avelino.md
resolve:
  - questoes-abertas.md Q-03
---

# ADR-026 — O catálogo não é um servidor; é um conjunto de coisas assinadas

## Decisão

Ilda não é infraestrutura. Ela é um **conjunto de módulos assinados pelos seus
autores**, distribuídos por qualquer canal — peer, blob, repositório,
marketplace. Não há registro central.

Cada rede decide o que existe nela:

| Ato | Quem | Efeito |
| :--- | :--- | :--- |
| publicar | autor | assina módulo e versão; torna disponível |
| **admitir** | autoridade da rede | concede capacidades ao módulo naquela rede |
| retirar versão | autor | novos não adotam; não alcança quem já admitiu |
| **revogar admissão** | autoridade da rede | efeito imediato naquela rede |

## Por que não precisa de mecanismo novo

**Admitir um módulo é conceder capacidade a ele.** A declaração de extensão traz
capacidades declaradas e permissões exigidas (ADR-004); admitir é dizer sim a
elas. Portanto:

- é operação de `ASSET`, e cai no portão do ADR-021 sem regra adicional;
- é **admissão**, que já é função exclusiva da autoridade — a mesma prevista para
  admissão de membro.

Um módulo é admitido como um membro é admitido. Não é analogia; é o mesmo ato
sobre um sujeito diferente.

## Por que não um registro central

Um registro único acima das autoridades recriaria o ponto central de confiança e
disponibilidade que o ADR-001 removeu do produto. Descoberta e conveniência não
justificam reintroduzi-lo na camada de módulos.

O marketplace continua possível — como **canal de distribuição**, não como fonte
de autoridade. Quem decide se um módulo roda numa rede é a autoridade dela.

## Revogação tem duas mãos, e elas não se sobrepõem

O autor **não pode** forçar remoção de uma rede que já admitiu sua versão. Se
pudesse, teria poder de desligamento remoto sobre operações alheias — inclusive
sobre uma emissão regulada em andamento.

A autoridade **pode** revogar a qualquer momento, e vale imediatamente na rede
dela. Quem opera a rede responde por ela.

## Consequências

- Versionamento continua por módulo (ADR-012). Uma rede pode operar versão
  anterior indefinidamente, e isso é decisão da autoridade dela, não do autor.
- Retirada de versão pelo autor precisa de canal de aviso, porque não tem efeito
  coercitivo. Notificar não é revogar.
- Falta especificar o que acontece com dados produzidos por um módulo cuja
  admissão foi revogada. Os registros são append-only e permanecem; quem passa a
  interpretá-los é questão em aberto.
