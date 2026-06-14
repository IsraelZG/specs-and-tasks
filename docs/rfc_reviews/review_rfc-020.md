# Revisão RFC-020: Calendário

## 1. Validação da Ideia Central
Tratar recorrência não como uma cascata explosiva de "Nós Gerados", mas sim como uma Regra Payload (`RRULE`) + Instâncias Virtuais Projetadas e "Nós de Exceção", é a única forma sã de manter o Graph leve e navegável. A costura dessa agenda genérica com o CRM e Mensagens consolida a ideia de que a plataforma não tem "O Calendário do ERP" separado do "Calendário Pessoal".

## 2. Refinamentos e Adições Sugeridas
- **Desambiguação de Lembretes:** A RFC cita lembretes na A.1 mas não clarifica como funcionam no backend. Num ambiente Descentralizado local-first, Lembretes (`Alertas`) não podem depender de um CRON centralizado. Devem ser agendamentos empurrados para a API do OS (Notification Center local) ou injetados na Command Palette / Overlay nativo, calculados via projeção do próprio client.
- **Sincronização Externa Bidirecional (A.4):** Se um usuário edita no Google Calendar, o conector classe D puxa. Mas e se o usuário deleta uma instância de recorrência importada dentro da plataforma? O conector precisa saber propagar um *Tombstone* para fora via API do Google. É crucial garantir que os overrides locais se traduzam perfeitamente no protocolo calDAV ou API proprietária da Microsoft.

## 3. Design System & UI Layout
### Ideias de Layout
- Visão Diária Condensada: Render do `CalendarGrid` onde as horas do dia em que "nada acontece" (ex: 2h as 6h da manhã) colapsam visualmente para maximizar o espaço dos blocos produtivos (Time-Blocking UI).
- Assistente de Agendamento Inteligente: Sobreposição na UI quando 3 peers estão tentando marcar algo e a engine sugere horários em verde baseados nas intersecções de Free/Busy.

### Componentes Necessários
- **Atoms:** `EventColorPill`, `RSVPIconButton`.
- **Molecules:** `AgendaDayBlock` (Lista sequencial compacta), `AvailabilitySlot` (Slot vazio clicável para marcação rápida).
- **Organisms:** `TimelineGridRenderer` (Motor flexível que suporta arrastar e esticar eventos no eixo Y), `EventDetailsSidebar`.

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `CONTENT:EVENT` (Nó mestre).
  - Nó Override Append-Only (Para exceções de recorrência).
- **Arestas:** 
  - `INVITED_TO` / `ATTENDING` (Arestas de convite e RSVP).

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Evento criado, disparando convites pelo módulo de Mensagens/Notificações.
- **Mutação:** Updates viram `SUPERSEDED_BY`. Mudanças pontuais em série recorrente viram "Overrides".
- **Fim de Vida:** Expiração (o evento passa). Deleção física é desnecessária; eles compõem o histórico produtivo da rede.
