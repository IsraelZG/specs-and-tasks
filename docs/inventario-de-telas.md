# Inventário de Telas (para mockups) — anexar às tasks de UI

> **Objetivo:** lista exaustiva de telas/superfícies para mockup, por módulo, incluindo modais, menus,
> estados (vazio/erro/carregando/offline) e fluxos. Complementa o
> [inventário de componentes](rfcs/inventario-componentes-layouts.md) (Atomic Design) — aqui são as
> **composições** (telas), lá são as peças. A **mecânica de interação** de cada tela (máquinas de
> estado de UI, gatilhos, padrões validados nos mockups Lovable) está em
> [mecanica-de-telas.md](mecanica-de-telas.md). Cada bloco aponta a(s) task(s) de UI dona(s).
> **Invariantes obrigatórios em toda tela:** i18n (6 locales + RTL), tokens `--ds-*` (I3), a11y AA,
> responsividade — ver `plano-aplicacao.md §Invariantes de TODA UI` e `diretrizes-ux.md`.
>
> **Convenção de prioridade:** ⭐ = superfície central (mockup primeiro) · ◻ = secundária · ▫ = estado/variante.

---

## A. Globais / Transversais (shell, identidade, sistema)

### A1. Shell & Composição — T-SHL
- ⭐ **App frame** — barra de navegação, área de painéis (FlexLayout), rodapé de status.
- ⭐ **Workspace switcher** — workspaces default + salvos nomeados (`SPEC:WORKSPACE`).
- ⭐ **Sistema de painéis** — painel (módulo+página+params), split, tabs, pilha de colapsados.
- ⭐ **Command palette** (overlay) — modos busca/ação/geração (T-IA-05); resultados progressivos.
- ◻ **Layout responsivo mobile** — multi-coluna → coluna única; chrome-como-módulo (menu reposicionado).
- ◻ **Drag-and-drop / share** — arrastar item entre painéis/módulos; sheet de compartilhar.
- ◻ **Deep-link / rota** — abertura de painel por URL.
- ▫ Estados: painel suspenso, painel em erro, painel carregando (skeleton), offline.
- **Menus:** menu global do app, menu de contexto de painel, menu de overflow.

### A2. Identidade & Onboarding — T-104, T-208/209/210, T-512, T-705
- ⭐ **Boas-vindas / escolha de entrada** — Criar nova rede (gênese) · Entrar por convite · Entrar com identidade.
- ⭐ **Criação de identidade** — geração de seed (12/24 palavras), backup da frase, confirmação.
- ⭐ **Desbloqueio** — senha (fator de desbloqueio), biometria opcional.
- ⭐ **Cerimônia de convite** (`ASSET:INVITE`) — receber convite, validar, criar `PROFILE:AUTHENTICATION`.
- ⭐ **Pareamento de dispositivo** — QR + verificação SAS (T-705).
- ◻ **Gênese gerida** — fundar rede corporativa/pública, URL de onboarding.
- ◻ **Seletor de persona** (`PROFILE:PERSONA`) — alternar Pessoal/Criador/Profissional.
- ▫ Estados: seed inválida, senha errada (sem vazar timing), convite expirado/reutilizado, offline-retry.
- **Modais:** confirmar backup da seed, revogar dispositivo, trocar persona.

### A3. Permissões, Consentimento & Segurança — T-501/503/504/506, asset-consent
- ⭐ **Prompt de consentimento** (`ASSET:CONSENT`) — conceder/negar capacidade (UCAN), escopo claro.
- ◻ **Gerenciador de permissões/papéis** (`ASSET:ROLE`) — quem pode o quê; revogar.
- ◻ **Tela de revogação** — revogar acesso + revogação por cortesia.
- ◻ **Bloqueio** (`BLOCKS`) — bloquear perfil; efeito (filtro de leitura).
- ▫ Estados: acesso negado (sem vazar dado), chave em rotação de época, conteúdo bloqueado como limite honesto.

### A4. Sistema / Conta / Configurações — design-system, T-901, T-903
- ⭐ **Configurações** — conta, idioma (6 locales + RTL), tema (claro/escuro/custom), densidade, acessibilidade.
- ⭐ **Editor de tema** (ThemeEditor) — customização 4 níveis (app→módulo→página→componente).
- ◻ **Indicador de conectividade/topologia** — status P2P, peers, sync (Onda 0).
- ◻ **Painel de telemetria** (T-903) — RTT, bytes/onda, WAL, exportar.
- ◻ **Central de notificações** — lista, agrupamento, marcar lido.
- ▫ Estados globais reutilizáveis: **vazio**, **erro**, **carregando/skeleton**, **offline**, **sincronizando**, **pendente vs finalizado**.
- **Menus:** menu de conta/avatar, seletor de idioma, alternador de tema.

### A5. IA & Agentes (transversal) — T-IA-04/05/06
- ⭐ **Command palette** (já em A1) — classificação de intenção; render progressivo de resultados.
- ◻ **Painel de agente** — agente de IA agindo (com **atribuição clara**: ação do usuário vs delegado).
- ◻ **Resultados de recuperação híbrida** (RRF) — busca semântica + filtro de permissão.
- ◻ **Geração de página** (`SPEC:PAGE` por agente) — preview + aceitar/editar.
- ▫ Estados: agente fora de escopo (recusa), geração em progresso, fonte/citação do resultado.

---

## B. Por módulo de negócio

### B1. Mensageria — T-MSG
- ⭐ Lista de conversas · ⭐ Conversa 1:1 · ⭐ Conversa em grupo · ⭐ Compositor (texto/anexo/mídia).
- ⭐ Chamada/conferência (LiveKit) — entrada, em-chamada, grade de participantes, controles.
- ◻ Detalhe de contato/grupo · ◻ Presença efêmera · ◻ Galeria de mídia da conversa.
- **Modais:** chamada recebida/efetuada, adicionar a grupo, anexar arquivo, encaminhar/compartilhar.
- ▫ Estados: sem conversas, sem conexão (fila de envio), mensagem não entregue, digitando.

### B2. Marketplace + Fintech — T-MK
- ⭐ Vitrine/listagem · ⭐ Detalhe do produto/listing · ⭐ Carrinho/checkout · ⭐ Status do pedido (saga).
- ⭐ Painel do vendedor — anúncios, vendas, repasses.
- ◻ Instrumentos financeiros (cessão/aporte/garantia) · ◻ Régua de cobrança · ◻ Multi-moeda/câmbio.
- **Modais:** pagamento (BaaS sandbox), confirmar compra, abrir disputa, cupom, oferta/lance.
- ▫ Estados: oversell (última unidade), saga pendente/compensada, pagamento falho/estornado, lance perdedor.

### B3. ERP / CRM — T-ERP
- ⭐ Pedido de venda · ⭐ Pedido de compra · ⭐ Estoque multi-depósito · ⭐ Pipeline CRM (kanban).
- ⭐ Visão 360 do cliente (traversal) · ◻ Contas a pagar/receber · ◻ Conciliação bancária.
- ◻ Dashboard analítico (projeções incrementais).
- **Modais:** nova ordem, reserva de estoque (LOCK), conciliar lançamento, mover etapa do pipeline.
- ▫ Estados: reserva expirada, projeção recalculando, limite de custo de consulta.

### B4. Contábil / Fiscal / RH — T-CFR
- ⭐ Plano de contas · ⭐ Livro/lançamentos derivados · ⭐ Apuração fiscal (competência).
- ⭐ Visão do contador (subgrafo do cliente) · ◻ Folha de pagamento · ◻ Fechamento de período.
- **Modais:** fechar competência (imutável), recálculo retroativo, exportar SPED/NF-e, novo colaborador/vínculo.
- ▫ Estados: jurisdição ausente (degrada), período fechado (read-only), conector fiscal ausente.

### B5. Mapa — T-MAP
- ⭐ Mapa (render GeoSpatial) · ⭐ Busca de lugares (proximidade) · ◻ Detalhe de lugar (`SPEC:PLACE`).
- ◻ Rota (via conector) com proveniência.
- **Modais:** filtros de busca, salvar lugar, compartilhar localização (efêmera/sensível).
- ▫ Estados: offline (cache), sem resultados, localização indisponível/negada.

### B6. Logística & Fulfillment — T-LOG
- ⭐ WMS — operações de armazém, endereçamento, inventário cíclico.
- ⭐ Fulfillment — alocação multi-depósito, ciclo com compensação.
- ⭐ App do entregador — fila de entregas, navegação, prova de entrega.
- ◻ Rastreio ao vivo (mapa) · ◻ Cotação/etiqueta (transportadora) · ◻ Reversa/disputa (escrow).
- **Modais:** confirmar coleta/entrega, abrir disputa "não chegou", surge/repasse.
- ▫ Estados: sem entregadores, rota recalculando, disputa segurando escrow.

### B7. Social & Feed — T-SOC
- ⭐ Feed (`SuperCard` + ranking Zen + RRF + slot de anúncio) · ⭐ Perfil público/privado.
- ⭐ Compositor de post/story · ⭐ Visualizador de story · ◻ Detalhe do post (comentários).
- ◻ Conexões/seguidores · ◻ DM (reusa Mensageria).
- **Modais:** novo post/story, configurar visibilidade, denunciar, bloquear, compartilhar.
- ▫ Estados: feed vazio, story expirado (honesto), privacidade retroativa, conteúdo bloqueado.

### B8. Streaming — T-STR
- ⭐ Player VOD (adaptativo) · ⭐ Página de canal/coleção · ⭐ Transmissão ao vivo (LiveKit).
- ◻ Player de áudio · ◻ Estúdio do criador (publicar/renditions).
- **Modais:** assinar/PPV/tip, qualidade/legendas, sem seeder (degradação declarada).
- ▫ Estados: processando renditions, live encerrada→VOD, buffering.

### B9. Anúncios — T-AD
- ⭐ Criação de campanha (`SPEC:AD_CAMPAIGN`) · ⭐ Criativo do anúncio · ◻ Segmentação/targeting.
- ◻ Dashboard de medição (CPM/CPC/CPA, pacing) · ▫ Slot de anúncio renderizado (no feed/pré-roll).
- **Modais:** definir orçamento/pacing, promover item (sem duplicar), revisar métrica.
- ▫ Estados: verba estourada, segmentação bloqueada (dado restrito), clique inflado (anti-fraude).

### B10. Email — T-EML
- ⭐ Caixa de entrada · ⭐ Thread/conversa · ⭐ Compositor · ◻ Seletor de conta (multi-conta).
- **Modais:** anexos, confirmar envio, mover/arquivar, configurar conta (IMAP/SMTP).
- ▫ Estados: sincronizando, envio como saga (pendente), eco suprimido, reentrega→no-op.

### B11. Calendário — T-CAL
- ⭐ Visões mês/semana/dia · ⭐ Detalhe de evento · ⭐ Criar/editar evento (RRULE).
- ◻ Convites/RSVP · ◻ Timeline · ◻ Sync externo (.ics).
- **Modais:** editor de recorrência, exceção de instância, capacidade/reserva, responder convite.
- ▫ Estados: recorrência longa (instâncias virtuais), conflito de capacidade, convite externo.

### B12. Suíte Office & Criação — T-OFF
- ⭐ Editor de documento (blocos, Automerge, backlinks) · ⭐ Planilha (fórmulas + ZEN) · ⭐ Apresentação/slides.
- ⭐ Editores de mídia (imagem/vídeo/áudio) com IA via compute.
- ◻ Navegador de arquivos · ◻ Base como view estruturada · ◻ Perfis de capacidade do motor.
- **Modais:** novo arquivo/perfil, exportar (PDF/PPTX), inserir mídia, co-edição (multiplayer/presença).
- ▫ Estados: salvando/sincronizando, conflito CRDT resolvido, export em progresso.

---

## C. Catálogos transversais de UI (mockup uma vez, reusar)

- **Modais base:** confirmação, destrutivo (deletar), formulário, sheet inferior (mobile), wizard multi-passo.
- **Menus base:** contexto (botão direito/long-press), overflow (⋯), seletor, dropdown, comando.
- **Estados base:** vazio (com CTA), erro (com retry), carregando (skeleton), offline, sem permissão, sincronizando, pendente/finalizado.
- **Notificações:** toast, banner, badge, central.
- **Navegação:** tabs, breadcrumb, paginação/scroll infinito, busca.
- **Feedback de operação assíncrona/saga:** progresso, compensação, lock com TTL (pendente local vs finalizado durável).

---

## D. Orquestrador (Nexus como produto — item 6, a confirmar)
*(Listado para completude; depende da decisão de promover o Nexus a módulo da Camada 2.)*
- Board de tarefas (kanban MGTIA) · Detalhe de task · Visão de worktree · Logs de agente.
- Gerenciador de plugins (provider/contexto/fs-terminal) · Roteamento de modelos · Gate visual (Lookout).

---

## E. Priorização sugerida para mockups (primeira leva)
1. **Shell + estados/modais/menus base** (A1, C) — tudo herda daqui.
2. **Onboarding + identidade** (A2) — primeira impressão, fluxos críticos.
3. **Mensageria** (B1) — marco de validação do substrato (M1).
4. **Feed social** (B7) e **Marketplace** (B2) — superfícies de maior densidade de interação.
5. **Command palette + IA** (A5) e **Suíte Office** (B12) — padrões ricos reusados por outros.
