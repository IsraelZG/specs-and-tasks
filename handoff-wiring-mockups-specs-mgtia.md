# Handoff: Trazer requisitos visuais dos mockups Lovable de volta às specs MGTIA

**Gerado em:** 2026-07-03
**Sessão de origem:** SuperApp V0.41 — sessão de execução de mockups Lovable (Sonnet 5). Completou a leva inteira A2–B11 + catálogo base (17 telas/módulos) no projeto Lovable, dirigindo o agente do Lovable via MCP e verificando cada tela ao vivo no browser (Chrome extension).
**Foco desta sessão:** Um agente (Sonnet 5 é suficiente — é trabalho de leitura+edição de specs, não de julgamento de design) percorre as tasks MGTIA reais (`tasks/T-*.md`, repo Docs) que correspondem a cada módulo mockado, e traz de volta os requisitos visuais/interação que emergiram durante a construção do mockup — sem copiar código do Lovable (é descartável) e sem inventar requisitos que o mockup não sustenta.

---

## Contexto essencial

**O que é o mockup Lovable e por que ele não é fonte de código:**
Projeto Lovable (`project_id`: `7f5a44a2-6bf8-4330-a3a8-f9740e8d80a9`, preview: https://id-preview--7f5a44a2-6bf8-4330-a3a8-f9740e8d80a9.lovable.app) é um **protótipo de UI puro, fora da cadeia MGTIA** — TanStack Start + TinyBase local, sem backend real, sem UCAN/permissões reais, sem P2P real. Ele existe só para validar fluxo/interação/estados antes de as tasks reais serem executadas. **Não rode manage-task.mjs nem git no Docs por causa dele** — isso já era regra desde o handoff anterior e continua valendo.

A stack de produção real (`apps/*` no superapp, pacotes `@plataforma/*`) é **completamente diferente** — React com o design system real, dados via UCAN/CRDT/P2P real, não TinyBase. Portanto: **nunca porte o código TSX do Lovable para o superapp.** O valor do mockup está nas *decisões* que ele validou — quais estados existem, qual a linguagem de aviso, qual o fluxo de interação, qual a hierarquia visual — não na implementação.

**O que já foi construído e verificado (todas as 17 telas testadas ao vivo no browser, não só o status "completed" do Lovable):**

| Bloco | Módulo | Commit Lovable | Prefixo de task MGTIA provável |
|---|---|---|---|
| A1 | Shell (colunas FlexLayout) | `1eb1e56` | `T-SHL-*` |
| A2 | Onboarding/Identidade | `d309813` | (não identificado — buscar prefixo) |
| A3 | Permissões/Consentimento | `893694a` | `T-501/503/504/506` (UCAN, ver handoff anterior) |
| A4 | Sistema/Conta/Configurações | `1b2a730` | `T-901`, `T-903` |
| A5 | IA & Agentes (command palette) | `bb066d7` | `T-IA-04/05/06` |
| B1 | Mensageria | `23b89cf` | `T-MSG-*` |
| C | Catálogo de componentes base | `62661fe` | (transversal — não é 1 task, é padrão de design system) |
| B7 | Social & Feed | `45dd2ec` | `T-SOC-*` |
| B2 | Marketplace + Fintech | `563a0b7` | `T-MK-*` |
| B12 | Studio (Office/Criação) | `4554147` | `T-OFF-*` |
| B3 | ERP/CRM | `ac20437` | `T-ERP-*` |
| B4 | Contábil/Fiscal/RH | `256a858` | `T-CFR-*` |
| B5 | Mapa | `5d577a1` | `T-MAP-*` |
| B6 | Logística & Fulfillment | `0a740b9` | `T-LOG-*` |
| B8 | Streaming | `692f393` | `T-STR-*` |
| B9 | Anúncios | `0c28533` | `T-AD-*` |
| B10 | Email | `5ea8dfb` | `T-EML-*` |
| B11 | Calendário | `28b492e` | `T-CAL-*` |

Confirmei via `Glob` que os prefixos `T-SOC`, `T-MK`, `T-SHL`, `T-MSG`, `T-512`, `T-ERP`, `T-CFR`, `T-MAP`, `T-LOG`, `T-STR`, `T-AD`, `T-EML`, `T-CAL`, `T-OFF` **já existem** em `tasks/` — não precisa criar tasks novas, é trabalho de enriquecer as existentes.

**Atenção — nem toda task com esse prefixo é frontend.** Verifiquei `T-SOC-01`: é 100% backend (`target_agent: frontend_agent`? não — conferir campo `target_agent` de cada task antes de tocar; `T-SOC-01` define `SocialGraph`/tipos TS em `apps/nexus-backend`, zero menção a UI). Já `T-SHL-01` é `target_agent: frontend_agent`, `status: draft:triaged`, e define o shell FlexLayout real (`packages/shell/src/workspace.ts`) — essa sim é candidata direta a receber os requisitos visuais do mockup A1.

**Conclusão prática:** para cada prefixo, olhe o `target_agent` de cada task-filha (`-01`, `-02`, `-03`...) antes de decidir se ela recebe requisito visual. Tasks de `logic_agent`/`crypto_agent`/`devops_agent` sobre tipos/protocolo geralmente não precisam de nada do mockup. Tasks de `frontend_agent` sim.

---

## Estado atual

- Todos os 17 blocos foram construídos no Lovable e **verificados manualmente no browser** (não apenas aceitos pelo status do agente Lovable — em pelo menos 2 casos o próprio agente Lovable relatou um "falso positivo" de teste interno que a verificação manual desmentiu, e em 1 caso real encontrei e corrigi um bug de verdade: `ThemeSync` ausente em `/catalogo`, e customizei o label do `DestructiveModal` que estava hardcoded como "Excluir definitivamente" quando reusado em contexto de "Fechar competência" — ambos já corrigidos).
- **Nenhuma task MGTIA foi tocada nesta sessão.** O trabalho foi 100% dentro do projeto Lovable via MCP.
- **Nada foi commitado no repo Docs** por causa do mockup (correto, por design).

## Tarefa

Para os módulos abaixo (comece pelos que bloqueiam outras tasks, ou pelos que o usuário priorizar), abra a task real correspondente em `tasks/`, compare com o que foi decidido no mockup, e:

1. **Se a task já tem Seção 2 (Contexto RAG) vazia ou fraca** para decisões de UI (estados, modais, invariantes de interação): adicione um apontador textual às decisões do mockup — **não ao código**, à decisão. Ex.: "O fluxo de consentimento não deve destacar visualmente Conceder sobre Negar (validado no mockup A3) — evita dark pattern." Não cole trechos de TSX do Lovable.
2. **Se a task ainda está em `draft:placeholder`/`draft:triaged`** (spec fraca): isso é candidato a `/endurecer-task` — mas o endurecimento em si é outro passo/skill; aqui você só está enriquecendo o RAG de contexto ANTES do endurecimento, para que quem endurecer tenha a decisão de UI à mão.
3. **Se a task já está `draft:hardened`/`ready`**: NÃO reabra a spec para adicionar isso livremente — se o requisito visual for uma mudança de contrato (ex. um campo novo, um estado obrigatório que não estava lá), isso é uma **decisão de arquiteto** (Seção 6 da task), não algo que se emenda por conta própria. Registre a lacuna e escale.
4. **Estados obrigatórios validados no mockup que vale generalizar como invariante de design system** (não são específicos de 1 task, valem para várias): considere se cabe em `docs/diretrizes-ux.md §6` (os 7 estados já documentados lá) ou em algum caderno de design — não precisa duplicar em cada task individual se já é regra geral.

### Decisões/invariantes concretas que emergiram construindo os mockups (ponto de partida, não lista exaustiva — releia as mensagens desta sessão para o texto completo de cada bloco B2–B11 se precisar do detalhe)

- **A3 Consentimento:** botões Conceder/Negar com peso visual igual (nenhum "destacado" sobre o outro) — evita dark pattern de UCAN grant.
- **A3 Acesso negado:** mensagem genérica que não distingue "não existe" de "sem permissão".
- **A3 Revogação:** linguagem de "revogação por cortesia" — peers que já sincronizaram podem reter até a próxima sync; isso é limite honesto, não bug.
- **B2 Marketplace — oversell:** ao comprar item com estoque 1, a UI precisa de um caminho de erro explícito ("este item acabou de esgotar") em vez de deixar a compra prosseguir silenciosamente — isso é uma corrida real que a spec de estoque (`T-MK-*`/`T-ERP-*` inventory) precisa contemplar no contrato, não só na UI.
- **B2/B3/B6 Saga:** o padrão visual pendente→confirmado→concluído (ou compensado) com badge de compensação explicando o que foi revertido é o padrão a reusar em qualquer fluxo assíncrono com possibilidade de falha (pagamento, alocação de entrega, etc.).
- **B4 Contábil — período fechado:** é read-only de verdade — tentar editar precisa bloquear com aviso, não só desabilitar silenciosamente.
- **B9 Anúncios — segmentação bloqueada:** quando um dado de segmentação é restrito por permissão, a UI mostra que *algo* foi restrito sem vazar *o quê* — mesmo princípio do "acesso negado" do A3, aplicado a targeting.
- **B10 Email — eco suprimido:** conceito P2P de não duplicar mensagem que retorna pelo próprio remetente — isso é um requisito de protocolo (`T-EML-*` ou onde for definido o protocolo de mensageria P2P), não só um textinho de UI.
- **B11 Calendário — instâncias virtuais de RRULE:** 1 linha persistida = N ocorrências visuais calculadas em memória a partir do `rrule` + `startAt` original — **isso é um requisito de dado real**, não só de renderização; se `T-CAL-*` especifica como `events` são persistidos, precisa refletir que instâncias recorrentes não são materializadas 1:1.
- **A2 Onboarding:** aviso de perda definitiva da seed BIP39 precisa de confirmação ativa (reintroduzir palavras específicas), não só um checkbox passivo.

---

## Restrições e decisões já tomadas — não relitigar

- **Mockup não é fonte de verdade de contrato de dados.** As tabelas TinyBase (`products`, `orders`, `events` etc.) foram desenhadas para servir a UI do mockup, não para bater com o modelo de dados real (`SPEC:*`, `CONTENT`, arestas do grafo). Não copie nomes de campo do TinyBase para as specs reais achando que é "o contrato" — extraia a *decisão de UX*, redesenhe o contrato de dados junto com quem já está endurecendo aquela task.
- **Paleta de cores é placeholder** (T-DS-05 decide a definitiva depois) — não wire cores específicas do mockup em nenhuma spec.
- **Bloco D (Orquestrador/Nexus como produto)** continua fora de escopo — não mockado, não hardened, aguardando decisão RFC-018.
- **Pendência cosmética conhecida, não crítica:** o rótulo "Sua câmera" corta na tela de chamada (B1) numa coluna estreita — é só um detalhe visual do mockup, não vale a pena virar requisito de spec.
- **Você não aprova nem faz merge de nada** — se ao ler uma task achar que o requisito visual implica mudança de contrato numa task já `hardened`/`ready`, você PARA e registra a lacuna (mesmo princípio do `pause` do worker MGTIA) — não edita a spec sozinho além do enriquecimento de RAG descrito acima.

---

## Arquivos relevantes

- Projeto Lovable (via MCP `mcp__85be0ef3-...`): `project_id=7f5a44a2-6bf8-4330-a3a8-f9740e8d80a9`. Use `list_files`/`read_file`/`get_message` (com os `message_id` da tabela acima, thread `main`) para reler qualquer decisão específica de um bloco sem precisar reconstruir o raciocínio.
- Preview ao vivo: https://id-preview--7f5a44a2-6bf8-4330-a3a8-f9740e8d80a9.lovable.app (onboarding com senha `senha123` após criar identidade, ou "Entrar com identidade" direto se a persistência TinyBase não tiver resetado).
- `tasks/T-SOC-*.md`, `T-MK-*.md`, `T-SHL-*.md`, `T-MSG-*.md`, `T-512.md`, `T-ERP-*.md`, `T-CFR-*.md`, `T-MAP-*.md`, `T-LOG-*.md`, `T-STR-*.md`, `T-AD-*.md`, `T-EML-*.md`, `T-CAL-*.md`, `T-OFF-*.md` — tasks candidatas.
- `docs/diretrizes-ux.md §6` — os 7 estados obrigatórios (referência para generalizar invariantes, em vez de duplicar por task).
- `CLAUDE.md` (raiz do Docs) — regras do MGTIA (não editar status manualmente, não rodar git no Docs por task, etc.) continuam valendo integralmente.

## Sugestão de skills

- **`/vincular-rag`** — é literalmente a skill feita para preencher a Seção 2 (Contexto RAG) em lote; rode nela depois de decidir quais apontadores adicionar, ou use como referência do formato esperado.
- **NÃO rode `/endurecer-task`** nesta sessão a menos que o usuário peça explicitamente — enriquecer RAG e endurecer são passos separados; misturar os dois nesta sessão infla o escopo.
- Se encontrar uma task `hardened`/`ready` que precisaria mudar de contrato por causa de um requisito visual: **não use skill nenhuma para editar** — registre e pare, é decisão de arquiteto (`/arquiteto-decisoes` é do humano+Sonnet, não desta sessão sozinha).
