# RFC-019 — Email (Cliente Real)
> **Status:** Proposta
> **Precedência:** depende da RFC-007 A.4 (conector **Classe D — espelho bidirecional**: IMAP/SMTP). É cliente de email **real** (bidirecional com o mundo externo), não email interno da rede. **Zero tipo de nó novo.** Onde não tocada, a doc vigente prevalece.
> **Transversais posteriores a aplicar na absorção:** layout de três painéis (caixas/threads/mensagem) segue o shell (RFC-026); filtros/regras de caixa são `SPEC:WORKFLOW` (RFC-022); **múltiplas contas externas do mesmo usuário** instanciam delegados separados por (usuário × conta), coerente com a compartimentação da RFC-027.

## A.1 — Conta como conector espelho

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/20-email-reference-spec.md` | novo | Documento canônico, §1 |

**Texto normativo:** cada conta de email do usuário é uma instância de **conector Classe D** (RFC-007 A.4): cursor durável (UIDVALIDITY/UIDNEXT), ingresso por polling + IDLE, credenciais fora do grafo no system-peer. O provedor externo é autoritativo sobre o estado da caixa.

## A.2 — Mensagens como espelho no grafo

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/20-email-reference-spec.md` | §2 | Adicionar |

**Texto normativo:**

1. Email recebido = `CONTENT` (espelho) governado por `SPEC:EMAIL`, idempotente por `Message-ID` (`external_ref`, RFC-007 A.3.2); thread = agregação por cabeçalhos. Anexos = blobs no media plane. A agregação em thread é materializada por **arestas nativas** `IN_REPLY_TO` e `REFERENCES`, traduzidas dos cabeçalhos RFC 2822 (`In-Reply-To`/`References`) durante o ingresso; a thread é o subgrafo transitivo dessas arestas, não uma reconstrução por heurística de assunto.
2. Estados (lido, arquivado, marcado) refletem o provedor; conflito resolve a favor do provedor (RFC-007 A.4.5). Busca/RAG (RFC-011) operam sobre o espelho local. A reflexão de estado é **bidirecional**: mutações de organização no espelho (ex.: arquivar, mover de pasta, aplicar/remover label) acionam o conector para aplicar a operação IMAP correspondente no provedor. Um **translation engine** mapeia pastas/labels do modelo do grafo para o esquema do provedor (ex.: `[Gmail]/All Mail`, labels múltiplas), preservando a resolução a favor do provedor em conflito (RFC-007 A.4.5).
3. **Anexos sob ponteiro cego.** A importação IMAP **não materializa** automaticamente anexos acima de um limiar `N` (MB) no media plane: registra um **ponteiro cego** (referência ao anexo no provedor) e baixa o blob **on-demand**, sob solicitação explícita do cliente, com cache local. O provedor permanece autoritativo sobre o anexo até a materialização.

## A.3 — Envio

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/20-email-reference-spec.md` | §3 | Adicionar |

**Texto normativo:** enviar = `CONTENT:INTENT` → conector executa SMTP como perna de saga (RFC-007 A.4 D3); marcador de origem (`X-Plataforma-Ref`) faz **supressão de eco** (D4) para o envio não voltar como ingresso novo. Falha de envio = compensação/retry, nunca "enviado" falso.

## A.4 — Costuras

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/20-email-reference-spec.md` | §4 | Adicionar |

**Texto normativo:** email integra CRM (RFC-013 A.5: interação com contato), Calendário (RFC-020: convites .ics) e a régua de cobrança (RFC-012 A.8.3) — todos a mesma lente sobre os mesmos nós.

## A.5 — Limites honestos

1. O provedor externo é a fonte da verdade; o grafo é espelho — offline-first é parcial (envio/leitura novos sincronizam quando online).
2. Spam, criptografia de transporte e reputação de remetente seguem o provedor; a plataforma não reescreve o protocolo de email.
3. Perda de cursor → ressincronização completa idempotente (RFC-007 A.4 D1), custo declarado.
4. **Falha de autenticação superficiada.** Quando o conector entra em estado **Offline-Auth** (credencial expirada ou token revogado), a falha é **superficiada imediatamente** ao usuário ("Credencial Inválida"); sagas de envio pendentes são **pausadas** (não entram em retry/compensação contínuos) até reautenticação. Falha de auth nunca é silenciosa nem confundida com falha transitória de rede.
5. **Política de retenção do espelho.** Emails podem ser configurados para **desidratar progressivamente** (descartar corpo/anexos mantendo metadados e `external_ref`, rehidratáveis sob demanda) ou **persistir** como registros anexados a deals do CRM (RFC-013). Expurgar a conta remove o conector; os nós espelhados seguem a política de retenção configurada.

## A.6 — Preparativos no plano

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-EML-01..03 |

**T-EML-01** conector Classe D de email (IMAP/SMTP, cursor, polling/IDLE, credenciais no system-peer) — depende de T-CN-03 (DoD Cloud); **T-EML-02** espelho `SPEC:EMAIL` idempotente por Message-ID + threading + anexos no media plane + envio como saga com supressão de eco; **T-EML-03** vetores adversariais (§0.1.7): reentrega de mensagem → no-op, envio falho não marca "enviado", eco suprimido.
