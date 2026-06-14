# RFC-020 — Calendário
> **Status:** Proposta
> **Precedência:** apoia-se na engine `Timeline` (caderno-3/03) e, para sincronizar com calendários externos (Google/Microsoft), no conector Classe D (RFC-007 A.4). **Zero tipo de nó novo** — evento é `CONTENT`; recorrência é o caso que mais aperta o minimalismo e é resolvida no payload, não em tipo novo. Onde não tocada, a doc vigente prevalece.
> **Transversais posteriores a aplicar na absorção:** `CalendarGrid`→`EventForm` segue o shell (RFC-026); convites/RSVP e lembretes podem ser `SPEC:WORKFLOW` (RFC-022); múltiplos calendários externos do mesmo usuário seguem a compartimentação por (usuário × conta) da RFC-027.

## A.1 — Evento

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/21-calendario-reference-spec.md` | novo | Documento canônico, §1 |

**Texto normativo:** evento = `CONTENT:EVENT` governado por `SPEC:EVENT` (início/fim, fuso, local — local podendo referenciar um `PLACE` da RFC-021). Calendário = coleção/agrupamento por aresta. Renderização pela engine `Timeline`.

## A.2 — Recorrência e exceções

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/21-calendario-reference-spec.md` | §2 | Adicionar |
| `docs/conceitos/recorrencia.md` | novo verbete | regra no payload, instâncias virtuais |

**Texto normativo:**

1. Recorrência = **regra no payload** (padrão RRULE: frequência, intervalo, fim) do evento mestre; as ocorrências são **instâncias virtuais projetadas** pela `Timeline`, não milhares de nós.
2. **Exceção** (uma ocorrência movida/cancelada) = nó de override append-only referenciando o mestre + a data da instância; a projeção aplica o override. Sem mutar o mestre, sem tipo novo — justifica o minimalismo (a alternativa, materializar cada ocorrência, seria desperdício).

## A.3 — Participantes e convites

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/21-calendario-reference-spec.md` | §3 | Adicionar |

**Texto normativo:** convidar = aresta de convite ao `PROFILE` + notificação; RSVP (aceito/recusado/talvez) = intent do convidado. Capacidade limitada (sala, vagas) reusa `reserva_capacidade` (RFC-012 A.2) quando o evento é um recurso disputado.

## A.4 — Sincronização externa

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/21-calendario-reference-spec.md` | §4 | Adicionar |

**Texto normativo:** espelhar Google Calendar/Microsoft = conector **Classe D** (RFC-007 A.4): cursor, polling/webhook, supressão de eco. O calendário externo é autoritativo sobre seus eventos; o interno sobre os que nasceram na plataforma. Convites por email trocam `.ics` (RFC-019).

## A.5 — Costuras e limites honestos

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/21-calendario-reference-spec.md` | §5 | Adicionar |

**Texto normativo:**

1. Reunião de CRM (RFC-013 A.5) e chamada agendada (RFC-018) são o mesmo `CONTENT:EVENT` por outra lente.
2. Limites honestos: fuso/DST seguem a regra de vigência (uma mudança de fuso aplica-se à projeção futura); sincronização com externo é best-effort sujeita ao provedor; recorrências muito longas são projetadas sob demanda, não infinitamente materializadas.
3. **Convite a participante externo** depende de interoperabilidade do provedor dele (troca de `.ics` por email, RFC-019); RSVP de fora do sistema chega por essa via, com a latência e a perda de fidelidade do padrão de email — não há garantia de entrega de convite a quem está noutra plataforma.
4. **Disponibilidade (free/busy) de terceiros** é best-effort: só se enxerga o que o outro compartilhou e o que está sincronizado; agenda de quem não usa a plataforma só é visível se o provedor externo expuser free/busy, o que nem sempre ocorre. Sugestão de horário é, portanto, palpite informado, não verdade.

## A.6 — Preparativos no plano

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-CAL-01..03 |

**T-CAL-01** `SPEC:EVENT` + recorrência RRULE com instâncias virtuais + override de exceção (DoD Protocolo/core); **T-CAL-02** convites/RSVP + capacidade por `reserva_capacidade` + render `Timeline`; **T-CAL-03** sync externo Classe D (Google/Microsoft) + `.ics` por email; vetor (§0.1.7): exceção não muta o mestre, recorrência longa não materializa em massa, eco de sync suprimido.
