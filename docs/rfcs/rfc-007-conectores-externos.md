# RFC-007 — Conectores de Mundo Externo
> **Status:** Proposta
> **Precedência:** generaliza `caderno-3-sdk/06-connectors.md` (que hoje cobre só notificação out-of-band e push cego) em uma taxonomia completa de conectores externos; estende [[oraculo-baas]], [[notification-connector]], [[push-cego]], [[peer-do-sistema]], [[agente-de-sistema]]. Onde não tocada, a doc vigente prevalece. Pré-requisito declarado das RFCs 009 (BaaS), 010 (NF-e, eSocial, ERPs de clientes), 015 (email real) e 017 (mapa).

## A.1 — Taxonomia de conectores externos

**Resolve:** os módulos exigem cinco padrões distintos de interação com sistemas externos, mas a doc vigente só nomeia dois (notificação de egresso, push de ingresso) mais o conceito de oráculo. Sem taxonomia, cada integração inventaria seu próprio padrão.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/06-connectors.md` | título + §0 novo | Renomear para "Conectores de Mundo Externo"; §0 apresenta a taxonomia; conteúdo atual vira §A (Classe A) e §B (Classe B) |
| `docs/conceitos/conector-externo.md` | novo verbete | Definição canônica + tabela de classes |

**Texto normativo:**

Todo acoplamento entre o grafo e um sistema externo pertence a exatamente uma das cinco classes:

| Classe | Nome | Direção | Afirma fato na linhagem? | Exemplo |
| :--- | :--- | :--- | :--- | :--- |
| A | Egresso notificacional | grafo → humano | Não (fire-and-forget) | SMTP de recuperação, WhatsApp/SMS da régua de cobrança |
| B | Ingresso content-blind | externo → dispositivo | Não (só acorda) | Push Connector (VAPID/FCM/APNs) |
| C | Oráculo transacional | bidirecional, por operação | **Sim** (perna de saga) | BaaS de pagamentos, emissão de NF-e, eSocial |
| D | Espelho bidirecional | bidirecional, contínuo | Sim (ingestão assinada) | Cliente de email IMAP/SMTP, API do ERP do cliente (garantidora) |
| E | Provedor de consulta | grafo → externo → grafo | Não (cache com TTL) | Geocoding/places/rotas (mapa), consulta de NF-e |

Classes A e B permanecem como especificadas hoje. Esta RFC normatiza C (consolidando [[oraculo-baas]] como contrato de conector), D e E.

**Critério de classificação:** a pergunta decisiva é *"o resultado entra na linhagem como fato durável?"*. Se sim e por operação → C; se sim e contínuo → D; se não → A/B/E conforme direção.

## A.2 — Contrato comum (identidade, credenciais, roteamento, modalidade)

**Resolve:** o que toda classe compartilha, para que "um conector por integração" (doutrina desta RFC) não signifique um padrão por integração.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/06-connectors.md` | §1 (reescrever) | Interface base + propriedades comuns |
| `docs/conceitos/conector-externo.md` | §Contrato | Resumo + link |

**Texto normativo:**

```typescript
interface ExternalConnector {
  id: ConnectorId;                      // estável, referenciável por SPECIFICATION
  class: 'A' | 'B' | 'C' | 'D' | 'E';
  capabilities(): ConnectorCapabilities; // canais/operações, rate limits, quotas
  health(): Promise<ConnectorHealth>;    // up/degraded/down + último sucesso
}
```

1. **Lugar:** conector é capacidade do [[peer-do-sistema]], nunca do core. Modality-gated: P2P puro sem operador não tem conector — limite honesto herdado do caderno-3/06 §2 e estendido a todas as classes. Cada conector é um processo/worker isolado no system-peer; falha de um não derruba outros.
2. **Identidade:** todo conector das classes C e D atua como [[agente-de-sistema]] com persona própria (`PROFILE:SYSTEM`), detentora de `ASSET:ROLE` que **escopa o que pode ler do grafo e o que pode afirmar nele**. Tudo que o conector publica é assinado por essa persona — auditabilidade de "quem afirmou este fato externo" por construção. Classes A/B/E não escrevem fatos duráveis e dispensam persona (mantêm apenas `ConnectorId`).
3. **Credenciais:** API keys, tokens OAuth, certificados (e-CNPJ para SEFAZ/eSocial) são infra do operador, **fora do grafo** (reafirma caderno-3/06 §2), em secret store do system-peer com rotação.
4. **Roteamento spec-driven (IoC):** a `SPECIFICATION` do fluxo declara `connector_id` + parâmetros (template, endpoint lógico, política de retry). Módulo e UI não conhecem o backend; trocar de provedor de BaaS é editar uma SPEC, não código (e a SPEC, por RFC-008, pode variar por jurisdição).
5. **Ingresso autenticado:** webhooks recebidos validam autenticidade por mecanismo do provedor (HMAC, mTLS, assinatura) **antes** de qualquer tradução para o grafo; ingresso não-autenticável degrada para polling.
6. **Quotas e throttle:** `capabilities()` declara limites; o despacho respeita-os com fila + backoff exponencial. Estouro de quota é evento de observabilidade, nunca perda silenciosa.

## A.3 — Tradução API ↔ grafo: idempotência e proveniência

**Resolve:** a regra única de como fatos externos viram nós, evitando duplicação na reentrega de webhooks e perda de rastreabilidade.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/06-connectors.md` | §2 novo | Adicionar |

**Texto normativo:**

1. **Fato externo = nó governado por SPEC do domínio**, nunca formato proprietário do provedor. O conector traduz (ex.: webhook de liquidação PIX → atualização do `ASSET:BALANCE_STATE` via fluxo intent + `APPROVED_BY` da persona-oráculo). O payload bruto do provedor pode ser anexado como `CONTENT` de evidência (retenção curta via G4) para auditoria.
2. **Idempotência por chave externa:** todo fato ingerido carrega `external_ref` (id do provedor: txid PIX, chave da NF-e, Message-ID do email) em campo `searchable`. Reentrega → mesmo `external_ref` → no-op determinístico. A projeção de dedup vive no `device_state.db` do system-peer.
3. **Sem side-effect de escrita local:** o grafo **nunca** dispara chamada externa como efeito colateral de uma escrita replicada (qualquer peer replicaria o efeito N vezes). Egresso transacional só ocorre como perna explícita de saga executada pelo conector ([[oraculo-baas]], posição no fluxo já normatizada), com [[asset-lock]] e compensação.
4. **Timeout = fato negativo:** ausência de resposta externa dentro do TTL do lock aborta a saga e registra [[fato-negativo-verificavel]]; o conector jamais "assume sucesso".
5. **Fail-fast sob degradação:** quando `health()` de um conector Classe C reporta `degraded`/`down`, o despacho da saga falha imediatamente (ou aciona o timeout de A.3.4 preventivamente) em vez de enfileirar sob backoff — para que um conector indisponível nunca segure [[asset-lock]] além do TTL do lock. O backoff de A.2.6 aplica-se a reentrega assíncrona, não a pernas transacionais com lock ativo.

## A.4 — Classe D: espelho bidirecional (email, ERPs de clientes)

**Resolve:** o padrão para sistemas externos que são *system of record* contínuo (caixa IMAP, ERP do cliente da garantidora) — o caso novo mais difícil.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/06-connectors.md` | §3 novo | Adicionar |
| `docs/conceitos/conector-espelho.md` | novo verbete | Definição + invariantes D1–D4 |

**Texto normativo:**

1. **D1 — Cursor durável:** sincronização incremental por checkpoint do provedor (UIDVALIDITY/UIDNEXT no IMAP, cursor/updated_since em APIs REST), persistido fora do grafo no system-peer. Perda de cursor → ressincronização completa idempotente (A.3.2 absorve duplicatas).
2. **D2 — Ingresso por polling + webhook:** webhook quando o provedor oferece (acelera), polling como piso garantido. Os dois caminhos convergem no mesmo pipeline de tradução.
3. **D3 — Egresso como intent:** ação local que deve refletir no externo (enviar email, dar baixa no ERP do cliente) é `CONTENT:INTENT` aprovado pelo validador do fluxo; o conector executa a chamada externa como perna de saga e publica o resultado (`external_ref` do lado externo). Falha → compensação declarada na SPEC.
4. **D4 — Supressão de eco:** todo registro que o conector escreve no sistema externo carrega marcador de origem (header `X-Plataforma-Ref` no email; campo de metadado/idempotency-key em APIs); o ingresso descarta registros cujo marcador case com `external_ref` já publicado, impedindo o ciclo externo→grafo→externo.
5. **Conflito:** o sistema externo é autoritativo sobre seu próprio estado (um email "lido" no provedor prevalece); o grafo é autoritativo sobre o que nasceu nele. Disputas reais (edição concorrente dos dois lados) são resolvidas pela SPEC do domínio — nunca pelo conector.
6. **D6 — Mutação por linhagem:** atualização incremental de um fato espelhado não muta o nó in-place; emite novo fato ligado ao anterior por `SUPERSEDED_BY`, preservando o audit trail. A idempotência por `external_ref` (A.3.2) garante que reentregas não gerem cadeias `SUPERSEDED_BY` espúrias.

## A.5 — Classe E: provedor de consulta (mapa, consultas fiscais)

**Resolve:** consultas request/response que não afirmam fatos, mas cujo resultado merece cache local-first.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/06-connectors.md` | §4 novo | Adicionar |

**Texto normativo:**

1. Resultado de consulta pode materializar como nó `CONTENT` governado por SPEC do domínio (ex.: `SPEC:PLACE` com lat/long no `geo_index`), com **TTL de validade declarado na SPEC** e poda via G4 — cache compartilhável entre peers da rede, respeitando os termos do provedor (a SPEC declara se o resultado é cacheável/replicável ou `LOCAL_TRANSIENT`).
2. Proveniência obrigatória: nó cacheado registra `provider` + `fetched_at`; a UI atribui a fonte quando exigido contratualmente.
3. Consultas não passam por intent (não há fato a serializar); passam direto pelo conector com quota/throttle do A.2.6.

## A.6 — Registro de instâncias e preparativos no plano

**Resolve:** declarar as integrações conhecidas do ciclo e as tarefas de fundação.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/06-connectors.md` | §5 novo | Tabela de instâncias |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-CN-01..04 |

**Texto normativo:**

| Conector | Classe | Consumidores (RFCs) |
| :--- | :--- | :--- |
| BaaS pagamentos (PIX, boleto híbrido, TED) | C | 009, 010 |
| SEFAZ / NF-e (emissão; consulta) | C; E | 010 |
| eSocial / folha | C | 010 (RH) |
| WhatsApp Business / SMS (régua de cobrança) | A (reuso) | 009 (garantidora), 010 (CRM) |
| Email cliente real (IMAP/SMTP por conta de usuário) | D | 015 |
| ERP do cliente (ingestão de cobranças da garantidora) | D | 009, 010 |
| Geo (places, geocoding, rotas) | E | 017, consumido por 009/010/012 |

Tarefas de fundação (DoD "Cloud" do plano §0.2): **T-CN-01** interface `ExternalConnector` + registro + health/quotas no system-peer; **T-CN-02** pipeline de tradução com idempotência por `external_ref` (A.3) + testes de reentrega; **T-CN-03** esqueleto Classe D (cursor, polling/webhook, supressão de eco) com provedor fake no testkit; **T-CN-04** persona [[agente-de-sistema]] por conector com `ASSET:ROLE` escopado + vetores adversariais (conector tentando afirmar fora do escopo → rejeição pelo validador).
