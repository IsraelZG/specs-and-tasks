# Inventário de Componentes & Layouts dos Módulos (Atomic Design)
> **Status:** Refinamento — preenche concretamente o catálogo prometido na RFC-006 (§A.2/A.3) e dá, por módulo, o esboço de layout (colunas do shell — RFC-026) e os organisms previstos.
> **Mapeamento ao modelo:** atoms/molecules/organisms = catálogo do design system (RFC-006); organisms ≈ engines polimórficas (caderno-3/03); templates = perfis de capacidade (RFC-025 A.1) + padrões de painel do shell (RFC-026); pages = `SPEC:PAGE` por módulo. Tudo consome só tokens semânticos (RFC-006 I1–I3); nada de estilo literal.

## 1. Atoms (compartilhados)

`Button`, `IconButton`, `Icon`, `Text`, `Heading`, `Label`, `Input`, `Textarea`, `NumberInput`, `Checkbox`, `Radio`, `Switch`, `Select`, `Slider`, `Avatar`, `Badge`, `Tag`/`Chip`, `Spinner`, `ProgressBar`, `Divider`, `Tooltip`, `Link`, `Image`, `Skeleton`, `Kbd` (dica de tecla), `ColorSwatch`, `Money` (valor monetário formatado por jurisdição — RFC-009).

## 2. Molecules (compartilhados)

`FormField` (label+controle+erro+ajuda), `SearchBar`, `MenuItem`, `ListItem`, `Breadcrumb`, `Pagination`, `Tabs`, `Dropdown`/`Popover`, `Toast`, `Alert`/`Banner`, `Card` (header/body/footer), `StatCard` (métrica), `AvatarGroup`, `RatingStars`, `DateTimePicker`, `FileUpload`, `EmptyState`, `ButtonGroup`, `SegmentedControl`, `FilterChip`, `Stepper`, `ContextMenu`, `PresenceDot`, `Toolbar`.

## 3. Organisms compartilhados (≈ engines, caderno-3/03)

Polimórficos e reutilizados por vários módulos:

- `SuperCard` — card de conteúdo polimórfico (feed, grids).
- `LayoutGrid` — composição responsiva.
- `DataTable` — tabela ordenável/filtrável/virtualizada.
- `Timeline` — eventos/linha do tempo.
- `FormRenderer` — JSON Forms sobre SPEC (RFC-008 A.6).
- `ChartRenderer` — gráficos a partir de ZEN sobre projeções (RFC-025).
- `MediaPlayer` — áudio/vídeo (RFC-017).
- `MessageThread` + `Composer` — chat (RFC-018).
- `MapCanvas` — GeoSpatial (RFC-021).
- `BlockEditor` — editor de blocos (docs — RFC-025).
- `SpreadsheetGrid` — grade de fórmulas (RFC-025).
- `KanbanBoard` — quadro de estágios (CRM — RFC-013).
- `WorkflowDiagram` — Mermaid de `SPEC:WORKFLOW` (RFC-022).
- `CommandPalette` — overlay de intenção (RFC-026/011).
- `NavRail` / `AppHeader` / `AppFooter` — chrome-como-módulo (RFC-026).
- `PanelManager` / `ColumnStack` — gerenciador de espaço + pilha de colapsados (RFC-026).
- `NotificationCenter`, `WorkspaceSwitcher`, `GameEngine` (2D/3D, RFC-024 A.5).

## 4. Templates (perfis e padrões de painel)

- **Perfis de capacidade do motor (RFC-025 A.1):** `documento`, `pagina_completa`, `anuncio`, `slide`, `comentario_post`.
- **Padrões de painel do shell (RFC-026):** `lista` (coluna de itens), `detalhe` (coluna gerada ao selecionar), `master-detail`, `dashboard`, `editor` (sessão colaborativa — RFC-027 A.4).

## 5. Por módulo: layout + organisms previstos

> Layout descrito em colunas do shell (RFC-026): Principal = foco; Secundária = comunicação/utilitários; Detalhe = coluna gerada ao selecionar item. Mobile colapsa para coluna única + footer.

### Rede Social (RFC-016)
- **Layout:** Principal = `FeedColumn`; Detalhe = `PostDetail`; perfil em master-detail.
- **Organisms:** `FeedColumn` (lista de `SuperCard`), `PostComposer`, `StoryBar`, `ProfileHeader`, `CommentThread`, `ReactionBar`. Molecules próprios: `FollowButton`, `ShareSheet`.

### Marketplace + Fintech (RFC-012)
- **Layout:** Principal = `ProductGrid`/`SearchResults` com `FilterSidebar`; Detalhe = `ProductDetail`; Secundária row = `CartDrawer`.
- **Organisms (marketplace):** `ProductCard`, `ListingGrid`, `ProductGallery` (Image/MediaPlayer), `PriceBlock`, `CheckoutPanel`, `CartDrawer`, `SellerCard`, `BidPanel` (leilão), `ReviewList`.
- **Organisms (fintech):** `WalletPanel` (`BALANCE_STATE`), `TransactionList` (`DataTable`), `TransferForm` (`FormRenderer`), `StatementChart` (`ChartRenderer`), `ApprovalCard` (`APPROVED_BY`), `InstrumentCard` (recebível/aporte/garantia).

### ERP/CRM (RFC-013)
- **Layout:** `dashboard` na Principal; master-detail para pedidos/contatos.
- **Organisms:** `DataTable` (pedidos/estoque), `KanbanBoard` (pipeline), `OrderDetail`, `Contact360` (abas: pedidos/interações/financeiro), `StatCard`s, `ChartRenderer`, `FormRenderer`.

### Contábil/Fiscal/RH (RFC-014)
- **Layout:** `dashboard` + `DataTable` intensivo.
- **Organisms:** `LedgerTable` (razão/balancete), `PayrollTable`, `ReportViewer`, `PeriodCloser` (workflow de fechamento), `EmployeeCard`, `PayslipView`, `TaxProvisionPanel`.

### Anúncios (RFC-015)
- **Layout:** `CampaignDashboard` na Principal; `editor` para criativo.
- **Organisms:** `CampaignBuilder` (form+preview), `AudienceBuilder`, `AdCreativeEditor` (reusa editor de imagem/vídeo), `AdSlot` (anúncio renderizado nas superfícies), `CampaignChart` (`ChartRenderer`).

### Streaming (RFC-017)
- **Layout:** Principal = `VideoGrid`; Detalhe = player + meta; live = player + chat.
- **Organisms:** `MediaPlayer` (VOD/áudio), `LivePlayer` + `LiveChat` (`MessageThread`), `ChannelHeader`, `PlaylistList`, `UploadPanel`, `MonetizationPanel` (assinatura/PPV/tip).

### Mensagens (RFC-018)
- **Layout:** master-detail (lista + thread); `CallPanel` em overlay/coluna.
- **Organisms:** `ConversationList`, `MessageThread`, `Composer`, `CallPanel` + `CallControls` (LiveKit), `PresenceIndicator`.

### Email (RFC-019)
- **Layout:** três painéis (caixas / threads / mensagem) colapsáveis por largura.
- **Organisms:** `MailboxList`, `ThreadList`, `MessageView`, `Composer` (rich), `AttachmentList`.

### Calendário (RFC-020)
- **Layout:** Principal = `CalendarGrid`; Detalhe = `EventCard`/`EventForm`.
- **Organisms:** `CalendarGrid` (`Timeline`), `EventCard`, `EventForm` (`FormRenderer`), `RSVPControl`, `AgendaList`, `MiniCalendar` (molecule).

### Mapa (RFC-021)
- **Layout:** `MapCanvas` ocupa a coluna; `PlaceDetail` em painel lateral.
- **Organisms:** `MapCanvas`, `PlaceCard`, `RoutePanel`, `MarkerCluster`, `PlaceDetail`, `SearchBar` (geo).

### Logística (RFC-023)
- **Layout:** `dashboard` (despacho) = mapa + quadro; rastreio em `Timeline`.
- **Organisms:** `ShipmentTracker` (`Timeline` + workflow), `DispatchBoard` (`MapCanvas` + `KanbanBoard`), `DriverCard`, `RouteMap`, `LabelPreview`, `ReturnFlow` (wizard).

### Suíte Office & Criação (RFC-025)
- **Layout:** `editor` (sessão colaborativa — RFC-027 A.4) na Principal.
- **Organisms:** `BlockEditor` (docs), `SpreadsheetGrid`, `SlideEditor` (motor de páginas perfil `slide`), `ImageEditor`/`VideoEditor`/`AudioEditor` (`ui` plugin/componente rico + `compute`), `Whiteboard`, `FormBuilder`, `ChartRenderer`, `FileBrowser`.

### Workflow (RFC-022)
- **Layout:** `master-detail` (lista de processos + inspetor).
- **Organisms:** `WorkflowDiagram` (Mermaid), `StateInspector`, `TaskInbox` (tarefas humanas/`APPROVED_BY`), `TransitionLog` (`AuditTrail`).

### Shell (RFC-026)
- **Organisms (chrome):** `NavRail`/`AppHeader`/`AppFooter`, `PanelManager`, `ColumnStack`, `CommandPalette`, `NotificationCenter`, `WorkspaceSwitcher`.

## 6. Observações de cobertura

1. **Reuso domina:** ~80% de cada módulo são atoms/molecules/organisms compartilhados; o que é próprio são poucos organisms de domínio. Confirma a tese de "lente sobre o mesmo substrato".
2. **Organisms = engines:** quase todo organism compartilhado já é uma engine do caderno-3/03 — o catálogo não inventa, formaliza.
3. **Lacunas a decidir no catálogo:** `Wizard`/`StepperFlow` (formulário multi-etapa guiado por workflow), `DataTable` virtualizada para grandes volumes (custo de BI — RFC-013 A.6), e `GameEngine` (qual lib base — RFC-024 A.5) são os três itens que pedem decisão de implementação antes de M-design-system.
