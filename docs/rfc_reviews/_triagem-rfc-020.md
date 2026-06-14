# Triagem — rfc-020 (Calendário)

**Achados extraídos:** 11
**Contagens por veredito:**
- INCORPORAR: 2
- JA-COBERTO: 4
- UI->INVENTARIO: 4
- REJEITAR: 0
- REVISAR-HUMANO: 1

### ⚠ REVISAR-HUMANO (decisão necessária)
- **020-09** — Assistente de Agendamento Inteligente (engine sugere horários em verde por interseção de Free/Busy entre 3+ peers): cruza UI com mecânica de inferência sobre dados free/busy best-effort de terceiros (A.5.4). Não é mero átomo de DS — exige decisão sobre onde mora a engine de sugestão e como reconcilia com a honestidade declarada ("palpite informado, não verdade"). Tensão entre feature de UI e limite normativo da própria RFC.

---

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 020-01 | Desambiguação de lembretes: em ambiente descentralizado local-first, lembretes (alertas) não dependem de CRON central; são agendamentos empurrados para a API do OS (Notification Center) ou injetados na Command Palette/overlay, calculados via projeção do próprio client (§2) | INCORPORAR | A.1 existente (Evento) | Lembretes/alertas de um evento **não dependem de CRON central**: num ambiente descentralizado local-first, são calculados por projeção no próprio client e empurrados para a API de notificação do SO (Notification Center) ou injetados na Command Palette/overlay nativo. Sem agendador central — o client é a fonte do disparo. | [x] |
| 020-02 | Sync bidirecional (A.4): deletar uma instância de recorrência importada dentro da plataforma precisa propagar um *tombstone* para fora via API do Google; overrides locais devem se traduzir em CalDAV / API proprietária da Microsoft (§2) | INCORPORAR | A.4 existente (Sincronização externa) | A sincronização Classe D é **bidirecional**: um override local sobre um evento importado (mover/cancelar uma ocorrência de recorrência) propaga o efeito de volta ao provedor — inclusive **tombstone** ao deletar uma exceção — traduzido para CalDAV ou API proprietária (Google/Microsoft), sob a mesma supressão de eco. Best-effort, sujeito à fidelidade do provedor (ver A.5.2). | [x] |
| 020-03 | Visão Diária Condensada: `CalendarGrid` colapsa visualmente horas ociosas (Time-Blocking UI) (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Layout `CalendarGridCondensed` (organismo, módulo Calendário) — grid diário que colapsa faixas horárias ociosas para maximizar blocos produtivos. | [x] |
| 020-04 | Atom `EventColorPill` (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | `EventColorPill` (átomo, módulo Calendário) — pílula de cor de categorização de evento. | [x] |
| 020-05 | Atom `RSVPIconButton` (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | `RSVPIconButton` (átomo, módulo Calendário) — botão de ação de RSVP (aceito/recusado/talvez). | [x] |
| 020-06 | Molecules `AgendaDayBlock` e `AvailabilitySlot`; Organisms `TimelineGridRenderer` e `EventDetailsSidebar` (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | `AgendaDayBlock` (molécula), `AvailabilitySlot` (molécula), `TimelineGridRenderer` (organismo — drag/resize no eixo Y), `EventDetailsSidebar` (organismo) — módulo Calendário. | [x] |
| 020-07 | Recorrência como RRULE + instâncias virtuais + nós de exceção (validação §1; modelagem §4 nó mestre + override append-only) | JA-COBERTO | A.2 | A.2 já define recorrência = regra RRULE no payload do mestre, ocorrências = instâncias virtuais projetadas pela Timeline, e exceção = nó de override append-only referenciando mestre+data. Sem norma nova. | [x] |
| 020-08 | Costura agenda genérica com CRM e Mensagens / "não tem calendário do ERP separado do pessoal" (§1) | JA-COBERTO | A.5.1 | A.5.1 já estabelece que reunião de CRM (RFC-013) e chamada agendada (RFC-018) são o mesmo `CONTENT:EVENT` por outra lente. | [x] |
| 020-09 | Assistente de Agendamento Inteligente: engine sugere horários em verde por interseção de Free/Busy entre 3+ peers (§3) | REVISAR-HUMANO | — | Cruza UI com engine de inferência sobre free/busy best-effort de terceiros (A.5.4); decisão arquitetural sobre onde mora a sugestão e como reconcilia com o limite honesto declarado pela própria RFC. | [x] |
| 020-10 | Arestas `INVITED_TO` / `ATTENDING` para convite e RSVP (§4) | JA-COBERTO | A.3 | A.3 já define convidar = aresta de convite ao `PROFILE` + notificação e RSVP = intent do convidado. A nomeação concreta das arestas é detalhe de implementação dentro do já normatizado. | [x] |
| 020-11 | Ciclo de vida: updates viram `SUPERSEDED_BY`; mudanças pontuais em série viram overrides; deleção física desnecessária (§5) | JA-COBERTO | A.2 / doc vigente | Override append-only já normatizado em A.2; o append-only / SUPERSEDED e ausência de deleção física são mecânica canônica do grafo (doc vigente prevalece, conforme cabeçalho da RFC). Sem norma nova específica de calendário. | [x] |
