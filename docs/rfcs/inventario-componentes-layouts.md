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

## 7. Componentes nomeados pelos reviews (refinamento por módulo)

> Consolida os achados de UI (§3) das revisões das RFCs. Refina os organisms genéricos do §5 com componentes nomeados e seu nível atômico. Itens já presentes no §1–§5 estão marcados *(já no catálogo)*. Nível: a=átomo · m=molécula · o=organismo.

**Design System / core (RFC-006):** `Label` (a, já no catálogo), `Avatar` (a, já), `Badge` (a, já), `SkeletonLoader`/`Skeleton` (a, já), `Switch` (a, já), `Checkbox` (a, já), `CardHeader` (m), `FormGroup` (m, ≈ `FormField`), `Breadcrumb` (m, já), `MessageBubble` (m), `Dialog`/`Modal` (o), `NavigationSidebar` (o, ≈ `NavRail`), `DataGrid` (o, ≈ `DataTable`), `PageHeader` (o).

**Conectores / admin (RFC-007):** `StatusBadge` (a), `ConnectorIcon` (a), `ProgressBar` de quota (a, já), `ConnectorHealthCard` (m), `RateLimitWarning` (m), `ConnectorHealthDashboard` (o), `ConnectorConfigForm` (o, JSON Forms via SPEC), `SagaExecutionLog` (o, perna de saga bloqueada).

**SDK / renderizador de páginas (RFC-008):** `JSONFormWidget` (a, widget polimórfico JSON Forms), `ExpressionErrorBadge` (a, overflow/throw de ZEN), `StreamingSkeleton` (m, shimmer por seção), `OverrideLayerPanel` (m, camadas de `EXTENDS`), `NodeOutlineOverlay` (o, bordas+IDs modo design), `PageRendererEngine` (o, runtime da árvore).

**IA / Shell (RFC-011):** `AgentAvatarIcon` (a), `RAGScoreChip` (a, score semântico), `AgentProvenanceBadge` (m, modelo+principal delegante), `OmnibarInput` (m), `CommandPaletteOverlay` (o, ≈ `CommandPalette`), `ProgressiveGenerationSkeleton` (o), `LovableUIPreview` (o, sandbox aceitar/recusar/editar SPEC antes do intent).

**Jurisdição / Fiscal (RFC-009):** `JurisdictionBadge` (a, bandeira/UF+sigla), `TaxCompositionRow` (m, variante jurisdicional que originou o valor), `PolicyFallbackBanner` (o, modo degradado declarado), `AuditTimeMachine` (o, recálculo por competência + diff).

**Marketplace / Plugins (RFC-010):** `PrivacyClassIndicator` (a, classe-de-privacidade do manifesto), `PluginRequirementChecklist` (m, GPU/Worker/Node vs perfil), `AsyncJobQueueManager` (o, progresso de renditions/embeddings da fila). Layouts: Dashboard de Ativos Computacionais (browser × server nodes), App Store segregada de plugins.

**Marketplace + Fintech (RFC-012):** `CurrencyMoneyView`/`Money` (a, já), `CartItemRow` (m, polimórfica por classe de liquidação), `SagaLegStatus` (m), `CartDrawer` (o, já), `FinancialTreeTable` (o, partida dobrada `SPENDS`→N `CREDITS`), `CheckoutSagaWizard` (o, progressão das pernas).

**ERP/CRM (RFC-013):** `WorkflowStateTag` (a, estado da `StateMachine`), `InventoryCountPill` (a, estoque já descontado locks), `BankReconciliationRow` (m, casamento por `external_ref`), `BIDashboardTile` (o, lê projeção analítica), `Customer360MasterDetail` (o, ≈ `Contact360`, timeline por traversal), `CRMPipelineKanban` (o, ≈ `KanbanBoard`).

**Contábil/Fiscal/RH (RFC-014):** `DebitCreditBadge` (a), `TaxRatePill` (a), `EmployeePayrollRow` (m), `PeriodLockRejectionPrompt` (m, oferece intent de reabertura), `FiscalTimeMachineBar` (m, vigência por competência), `TAccountsExplorer` (o, razonetes com drill-down), `GeneralLedgerTable` (o, ≈ `LedgerTable`), `FiscalClosingWizard` (o, ≈ `PeriodCloser`).

**Anúncios (RFC-015):** `SponsoredLabel` (a), `BudgetMeterBar` (a), `AdSlotPlaceholder` (a/m), `CampaignRow` (m), `AdPlacementWidget` (o, ≈ `AdSlot`), `AudienceBuilderForm` (o, ≈ `AudienceBuilder`), `CampaignManagerView` (o, Business Manager + funil workflow).

**Rede Social (RFC-016):** `AvatarRing` (a), `LikeHeartToggle` (a), `FollowButton` (a, já), `StoryBubbleList` (m, ≈ `StoryBar`), `SocialActionRow` (m, ≈ `ReactionBar`), `InfiniteFeedRenderer` (o, ≈ `FeedColumn`), `ProfileHeaderArea` (o, ≈ `ProfileHeader`), Story viewer com pré-busca de arestas (o).

**Streaming (RFC-017):** `PlaybackScrubber` (a, preview thumbnails), `QualitySelector` (a, rendition), `LiveBadge` (a), `VideoThumbnailCard` (m), `SuperChatTipRow` (m, tip = `CREDITS`), `MediaPlayerSurface` (o, Theatre/Mini-PiP sem reload de página), `MediaPlayerEngine` (o, ≈ `MediaPlayer`), `CreatorStudioDashboard` (o, pipeline de transcode/publicação).

**Mensagens (RFC-018):** `ReadReceiptTick` (a), `OnlineDot` (a, ≈ `PresenceDot`), `TypingBubble` (a), `CallDurationTimer` (a), `ChatMessageBubble` (m, reply de contexto), `CallLogBanner` (m), `MessagesSplitView` (o, master-detail), `ChatWindow` (o, lista virtualizada), `CallPanel` (o, PiP universal, já), `VideoConferenceGrid` (o, LiveKit Room).

**Email (RFC-019):** `EmailReadDot` (a), `AttachmentPill` (a), `ThreadCountBadge` (a), `EmailThreadItem` (m), `EmailContextActionBar` (m, ações sugeridas por RAG), `EmailComposeWindow` (o, editor→saga SMTP), `InboxMailboxViewer` (o, tri-pane).

**Calendário (RFC-020):** `EventColorPill` (a), `RSVPIconButton` (a, ≈ `RSVPControl`), `AgendaDayBlock` (m), `AvailabilitySlot` (m), `CalendarGridCondensed` (o, colapsa faixas ociosas), `TimelineGridRenderer` (o, drag/resize eixo Y), `EventDetailsSidebar` (o).

**Mapa (RFC-021):** `CustomGeoPin` (a, ícone temático da SPEC), `ZoomControl` (a), `MapOverlayCard` (m, card flutuante transparente), `PlaceAutocompleteInput` (m, RRF local + fallback Classe E), `InteractiveMapCanvas` (o, ≈ `MapCanvas`, aceita pins reativos cross-módulo).

**Workflow (RFC-022):** `StatusStepIndicator` (a), `TimerCountdownBadge` (a), `TransitionArrow` (a), `WorkflowNodeBox` (m, destaque do estado ativo), `ApprovalRequestBanner` (m, `APPROVED_BY` pausando instância), `VisualWorkflowEditor` (o, ReactFlow→DSL), `WorkflowInstanceAuditLog` (o, ≈ `TransitionLog`, vista "metrô").

**Logística (RFC-023):** `StatusTimelineDot` (a), `BarcodeScannerWidget` (a), `DeliveryRouteStop` (m), `DispatchKanbanBoard` (o), `FulfillmentWaveManager` (o), `DispatchBoard` (o, já — mapa+kanban), `WMSScannerView` (template mobile).

**Plugins-Frontend (RFC-024):** `PermissionLockIcon` (a, estado de permissão no frame), `PluginCrashBoundary` (m, fallback de crash), `SandboxFrame` (o, wrapper de iframe com borda/affordance), `PluginPermissionManager` (o, modal de permissões estilo extensão).

**Suíte Office (RFC-025):** `SlashCommandInput` (a), `CellReferencePill` (a), `ContextualToolbar` (m, barra flutuante na seleção), `RichBlockRenderer` (m, bloco rico + drag handle), `SlideDeckPreview` (o), layout `distraction-free` (chrome mínimo do perfil `documento`).

**Shell / composição (RFC-026):** `ResizerBar` (a, splitter com snap magnético), `PanelGrabHandle` (a), `CollapsedPanelTab` (a), `ShortcutChip` (a), `OmnibarOmniSearch` (m, ≈ `CommandPalette`), `TransformableMobileFooter` (o, footer-rampa→menu full-screen), `FlexLayoutTreeSolver` (o, container raiz + gerenciador determinístico).

**Módulos / delegação (RFC-027):** `AgentModeIndicator` (o, "sombra" do delegado em ação assistida), `DelegatePermissionCenter` (o, delegados vivos + `ASSET:ROLE` + revogação).
