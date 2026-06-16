# 22-calendario-reference-spec.md — Calendário

> Fonte: RFC-020 (absorvida e deletada). Apoia-se na engine `Timeline` (caderno-3/03) e, para sincronizar com calendários externos (Google/Microsoft), no conector Classe D (RFC-007 A.4). **Zero tipo de nó novo** — evento é `CONTENT`; recorrência é o caso que mais aperta o minimalismo e é resolvida no payload, não em tipo novo. Onde não tocada, a doc vigente prevalece. Transversais posteriores a aplicar na absorção: `CalendarGrid`→`EventForm` segue o shell (RFC-026); convites/RSVP e lembretes podem ser `SPEC:WORKFLOW` (RFC-022); múltiplos calendários externos do mesmo usuário seguem a compartimentação por (usuário × conta) da RFC-027.

---

## §1 — Evento

Evento = `CONTENT:EVENT` governado por `SPEC:EVENT` (início/fim, fuso, local — local podendo referenciar um `PLACE` da RFC-021). Calendário = coleção/agrupamento por aresta. Renderização pela engine `Timeline`. Lembretes/alertas de um evento **não dependem de CRON central**: num ambiente descentralizado local-first, são calculados por projeção no próprio client e empurrados para a API de notificação do SO (Notification Center) ou injetados na Command Palette/overlay nativo. Sem agendador central — o client é a fonte do disparo.

---

## §2 — Recorrência e exceções

1. Recorrência = **regra no payload** (padrão RRULE: frequência, intervalo, fim) do evento mestre; as ocorrências são **instâncias virtuais projetadas** pela `Timeline`, não milhares de nós.
2. **Exceção** (uma ocorrência movida/cancelada) = nó de override append-only referenciando o mestre + a data da instância; a projeção aplica o override. Sem mutar o mestre, sem tipo novo — justifica o minimalismo (a alternativa, materializar cada ocorrência, seria desperdício). Ver [[recorrencia]].

---

## §3 — Participantes e convites

Convidar = aresta de convite ao `PROFILE` + notificação; RSVP (aceito/recusado/talvez) = intent do convidado. Capacidade limitada (sala, vagas) reusa `reserva_capacidade` (RFC-012 A.2) quando o evento é um recurso disputado.

---

## §4 — Sincronização externa

Espelhar Google Calendar/Microsoft = conector **Classe D** (RFC-007 A.4): cursor, polling/webhook, supressão de eco. O calendário externo é autoritativo sobre seus eventos; o interno sobre os que nasceram na plataforma. Convites por email trocam `.ics` (RFC-019). A sincronização Classe D é **bidirecional**: um override local sobre um evento importado (mover/cancelar uma ocorrência de recorrência) propaga o efeito de volta ao provedor — inclusive **tombstone** ao deletar uma exceção — traduzido para CalDAV ou API proprietária (Google/Microsoft), sob a mesma supressão de eco. Best-effort, sujeito à fidelidade do provedor (ver §5).

---

## §5 — Costuras e limites honestos

1. Reunião de CRM (RFC-013 A.5) e chamada agendada (RFC-018) são o mesmo `CONTENT:EVENT` por outra lente.
2. Limites honestos: fuso/DST seguem a regra de vigência (uma mudança de fuso aplica-se à projeção futura); sincronização com externo é best-effort sujeita ao provedor; recorrências muito longas são projetadas sob demanda, não infinitamente materializadas.
3. **Convite a participante externo** depende de interoperabilidade do provedor dele (troca de `.ics` por email, RFC-019); RSVP de fora do sistema chega por essa via, com a latência e a perda de fidelidade do padrão de email — não há garantia de entrega de convite a quem está noutra plataforma.
4. **Disponibilidade (free/busy) de terceiros** é best-effort: só se enxerga o que o outro compartilhou e o que está sincronizado; agenda de quem não usa a plataforma só é visível se o provedor externo expuser free/busy, o que nem sempre ocorre. Sugestão de horário é, portanto, palpite informado, não verdade.
