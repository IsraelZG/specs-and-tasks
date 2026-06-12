# 02-cryptographic-lineage-and-auth.md — Cryptographic Lineage & Auth Specification

Este documento define os modelos de identidade criptográfica, atribuição causal, controle de acesso e recuperação de chaves na Plataforma Projeto SuperApp V0.41.

---

## 1. Identidade e Modelo Multi-Persona

A identidade de um usuário humano na Plataforma Projeto SuperApp V0.41 é estruturada em camadas independentes para assegurar a separação rigorosa de contextos e a privacidade de interações.

### 1.1 A Identidade-Âncora (`PROFILE:AUTHENTICATION`)
> Conceito canônico: [[profile-authentication]]
* **Definição**: É a raiz criptográfica do usuário humano dentro de uma rede específica. Carrega a chave privada mestra Ed25519 e os metadados de credencial.
* **Privacidade**: Nunca é diretamente exposto a outros peers em interações cotidianas (conversas, transações, posts). Funciona como o gerador interno de assinaturas.

### 1.2 Os Dados Pessoais (`CONTENT:PERSONAL_DATA`)
* **Definição**: Nó de conteúdo contendo dados civis privados do titular (nome real, e-mail, telefone, CPF/documentos).
* **Segurança**: Vinculado ao nó `PROFILE:AUTHENTICATION` correspondente e encriptado com chaves do usuário. O acesso de terceiros depende de consentimento explícito via [[asset-consent|`ASSET:CONSENT`]].

### 1.3 As Máscaras Públicas (`PROFILE:PERSONA`)
Definição canônica: [[profile-persona]].

### 1.4 Identidade de Rede (`PeerId`): Duas Variantes

> **Normativo (RFC-005 §A.5).** O `PeerId` existe em **duas variantes**, com papéis ortogonais. Ver [[peer-id]] e [[delegacao-de-dispositivo]].

* **`DevicePeerId = blake2s256(DEVICE_PUB_KEY)`** — identidade **de transporte**, derivada da chave Ed25519 **estável e exclusiva do dispositivo**, gerada no provisionamento (§1.7) e nunca exportada. Usada no handshake Noise_XX (§1.4.1), no [[swarm-registry|`SwarmRegistry`]], no [[relay-trust-model|`RelayTrustModel`]] (scores e shadowbans acumulam por dispositivo), no histórico em `device_state.db` e no [[graph-based-routing|Graph-Based Routing]] morno. Por ser estável, preserva a auto-certificação e a reputação de longo prazo.
* **`PersonaPeerId = blake2s256(PROFILE:PERSONA_PUB_KEY)`** — identidade **de aplicação** (endereçamento, arestas, UCANs), inalterada em relação à definição original.

**Vínculo dispositivo ↔ identidade.** Um dispositivo fala por uma persona apenas se existir no grafo um `ASSET:PERMISSION` (escopo de operação do dispositivo) ligado por **`DELEGATED_TO`** à chave pública do dispositivo, assinado pela identidade-âncora. Emissão e revogação de delegação **incrementam a Época de Identidade** (§3.1.1). Revogar = [[tombstone-lapide|lápide]] na delegação + bump; a chave mestra e os demais dispositivos seguem intactos.

**Canal único por par de dispositivos.** Uma conexão Noise_XX por par (sobre os `DevicePeerId`), multiplexada em sub-streams. Cada mensagem carrega o `PersonaPeerId` emissor e referencia o UCAN; o receptor valida, por sub-stream, a cadeia *persona → delegação de dispositivo → UCAN do escopo*. Persona sem autorização ⇒ rejeição na camada de aplicação, sem derrubar a conexão. Trocar de persona não abre conexões novas.

Por serem derivados de chaves Ed25519, ambos os `PeerId` são **auto-certificáveis**: o handshake de conexão exige um desafio-resposta provando posse da chave privada antes de qualquer troca de dados, eliminando *spoofing* de identidades existentes.

> **Fronteira de segurança.** Auto-certificação resolve *spoofing*, não [[defesa-sybil|ataques Sybil]]. A resistência a Sybil é responsabilidade do modelo de acesso por convite / web-of-trust da rede (custo deliberado de criação de identidade), **não** desta derivação de hash.

#### 1.4.1 Handshake de Autenticação (Noise Protocol Framework — Noise_XX)

> Conceito canônico: [[noise-xx]]

O handshake criptográfico que autentica a conexão adota o **Noise Protocol Framework**, padrão **Noise_XX** (autenticação mútua):

1. O Noise_XX é executado **após** o estabelecimento do WebRTC Data Channel (SDP exchange concluído), utilizando o data channel como transporte subjacente.
2. O handshake ocorre em **3 round-trips**, trocando:
   - `DevicePeerId = blake2s256(DEVICE_PUB_KEY)` (a chave estática do Noise_XX é a **chave do dispositivo**; ver §1.4)
   - `identity_epoch_index` (índice da Época de Identidade vigente; ver §3.1.1)
   - Nonce assinado com a chave privada Ed25519 do dispositivo
3. **Validação precoce de época:** Se o `identity_epoch_index` divergir entre os peers durante o Noise_XX, a conexão **não é descartada** — o data channel é imediatamente desviado para o pipeline de **Catch-up de Identidades (Onda 0)**, forçando a sincronização de chaves, delegações de dispositivo e UCANs atualizados antes de qualquer tráfego de domínio. Épocas de Conteúdo **nunca** são avaliadas no handshake (§3.1.1).
4. Com épocas alinhadas ao final do Noise_XX, o peer é registrado como **"conectado"** no `SwarmRegistry` (indexado por `DevicePeerId`, com `device_personas` para as personas ativas/atestadas).
5. Falhas criptográficas (assinatura inválida, chave incorreta) resultam em **shadowban de 24 h** no `RelayTrustModel` do peer local.

> **Implementação de referência:** `@noise-crypto/noise` (WASM/browser) ou `noise-c.wasm` (Electron/Node). Noise_XX é o padrão de autenticação mútua do ecossistema libp2p.

### 1.5 Delegação de Persona Corporativa
Em redes corporativas, a empresa (`PROFILE:ORGANIZATION`) pode emitir um `PROFILE:PERSONA` persistente para um cargo (ex: "Gerente Financeiro") e delegar sua operação temporária a um funcionário.
1. A empresa cria o `PROFILE:PERSONA` do cargo corporativo e emite um `ASSET:ROLE` associado.
2. A empresa cria uma aresta `DELEGATED_TO` apontando o asset para a chave `PROFILE:AUTHENTICATION` do funcionário.
3. O funcionário assume a persona e assina transações corporativas em nome do cargo.
4. Ao desligar o funcionário, a empresa revoga o asset (aresta lápide com `weight = 0`). A persona corporativa e todo o histórico de mensagens permanecem sob a propriedade institucional da empresa.

### 1.6 Integridade do Agente de Sistema (v4)

> Conceitos canônicos: [[agente-de-sistema]] · [[desafio-canary]]

O [[profile-system|`PROFILE:SYSTEM`]] roda no device do humano (hardware potencialmente hostil) e a plataforma **não usa TEE/TPM**. A integridade é tratada por **detecção pós-hoc**, não por proteção de hardware:

1. **Auditoria do que fez** (reexecução determinística onde aplicável).
2. **Desafios "canary":** tarefas de gabarito conhecido, indistinguíveis do trabalho real, injetadas proativamente. Fortes para trabalho determinístico (assinatura, merge, regra Zen — gabarito re-verificável por qualquer um), storage (desafio-resposta) e banda (peer-sonda); fracos para compute não-determinístico (IA). Elevam o custo de trapacear, não o eliminam (risco "defeat device" se o desafio for distinguível).

Em redes com autoridade, a suíte contínua de honeypots é um recurso gerenciado (**integridade-como-serviço**). Princípio: o agente é confiável para **orquestrar**, nunca para **afirmar** o não-verificável.

### 1.7 Cerimônia de Provisionamento de Dispositivo (QR + SAS)

> **Normativo (RFC-005 §A.5).** Caminho feliz multi-device, distinto da recuperação de chaves (§4). Ver [[delegacao-de-dispositivo]].

1. O dispositivo novo gera seu par Ed25519 **definitivo** + um par **efêmero de pareamento** (TTL 5 min); exibe um QR com multiaddr transiente, chave pública efêmera e nonce.
2. O dispositivo confiável escaneia o QR e abre um canal Noise_XX contra a chave efêmera (canal de cerimônia, sem persona).
3. **SAS (Short Authentication String):** ambos os dispositivos exibem o mesmo código curto derivado do transcript do handshake; o usuário confirma visualmente — mitiga MITM no pareamento.
4. O dispositivo confiável emite o `ASSET:PERMISSION` com `DELEGATED_TO` → chave **definitiva** do dispositivo novo, assina, grava no grafo e **incrementa a Época de Identidade** (§3.1.1). A chave mestra **nunca** atravessa o canal.
5. As chaves efêmeras são destruídas; o QR expira. O dispositivo novo baixa o snapshot de bootstrap e opera com chave própria sob a delegação; **obtém as chaves de época naturalmente via Key Vault de Rede (§3.3.2)** — sem transferência especial (a pré-carga de chaves durante a cerimônia é apenas otimização, nunca premissa).

**Por que delegar e não transferir a chave mestra:** isolamento de hardware, revogação granular por dispositivo e aderência ao capability model.

---

## 2. Controle de Acesso Baseado em UCAN, ASSET:PERMISSION e ASSET:ROLE

A Plataforma Projeto SuperApp V0.41 adota uma separação rigorosa entre **Fatos Sociais/Estruturais** (ex: pertencer a um grupo via aresta [[participates-in|`PARTICIPATES_IN`]]) e **Autorizações Técnicas de Acesso**. A existência de uma aresta `PARTICIPATES_IN` não concede permissão criptográfica de leitura ou escrita.

### 2.1 ASSET:PERMISSION e ASSET:ROLE

> Conceitos canônicos: [[asset-permission]] · [[asset-role]]

* **`ASSET:PERMISSION`**: Representa um direito atômico e granular de acesso. É definido por:
  * **Query de Traversal (Leitura)**: Especifica o subgrafo acessível. Contém `root` (nó raiz), `depth` (profundidade limite $\le$ 6), `direction` (outbound, inbound ou bi-directional), além de filtros opcionais para tipos de `edges` (arestas) e `nodes` (nós).
    * **Invariante de Validação de Traversal Profundo**: Para profundidades maiores que 1 (`depth > 1`), o UCAN **deve obrigatoriamente** incluir um filtro de arestas (`edge_filter`). Esta whitelist de filtros é validada no formato de pares **`(tipo_aresta -> tipo_no_alvo_permitido)`** (ex: `AGGREGATES -> ASSET:PERMISSION` ou `CONTAINS -> CONTENT:DOCUMENT`), impedindo que o traversal de múltiplos hops se desvie do caminho estrutural inócuo e termine alcançando nós que contenham dados pessoais ou sensíveis.
  * **Restrições de Mutação (Escrita)**: Delimita as arestas e nós que o titular pode criar ou modificar no subgrafo autorizado (profundidade limite $\le$ 6).
* **`ASSET:ROLE`**: Representa um papel ou função de negócio. É um agrupamento lógico que conecta múltiplos nós `ASSET:PERMISSION` através de arestas estruturais do tipo [[aggregates|`AGGREGATES`]] (indicando composição).
* **Relacionamento `REQUIRES`**: Nós `ASSET:PERMISSION` podem se relacionar com outras permissões via arestas [[requires|`REQUIRES`]], modelando pré-requisitos lógicos de acesso. Ambas as arestas (`AGGREGATES` e `REQUIRES`) apontam para o `entity_id` estável das entidades.
* **Templates vs. Instanciação Física**: Os moldes/templates de papéis e permissões residem no payload das especificações (`SPECIFICATION`) sob as propriedades `permission_templates` e `role_templates`. Eles funcionam estritamente como um **blueprint (molde)** conceitual de suporte ao código de bootstrap.
  > [!IMPORTANT]
  > Para fins de validação de acesso e controle de segurança, o sistema **nunca consulta o payload de SPECIFICATIONs**. A validação de direitos é feita consultando unicamente os ativos físicos do usuário (`ASSET:ROLE` / `ASSET:PERMISSION`) instanciados como nós no banco de dados, e o DAG físico resultante de pré-requisitos conectados pelas arestas `AGGREGATES` e `REQUIRES` no banco.

### 2.2 UCAN e Separação do Cofre de Chaves (Key Vault)

> Conceitos canônicos: [[ucan]] · [[key-vault]]

* A autenticação e a cadeia de delegação de acesso baseiam-se em tokens **UCAN (User Controlled Authorization Networks)**.
* **Separação Criptográfica**: Ao contrário de modelos em que tokens carregam chaves de conteúdo diretamente, os UCANs na Plataforma Projeto SuperApp V0.41 funcionam estritamente como **provas de autorização de tráfego**. O payload de um UCAN *nunca* contém material de chaves criptográficas (como chaves AES ou privadas).
* **Fluxo de Acesso Inverso (Capabilities-Based)**: O fluxo de solicitação e validação de dados opera de forma inversa:
  1. O peer que solicita o dado **deve exibir suas credenciais (o token UCAN correspondente) diretamente anexadas à requisição**.
  2. Esse token UCAN contém e descreve a **Query de Traversal** que será executada localmente para retornar os dados.
  3. O peer que fornece o dado (ou o Key Vault local) valida criptograficamente as assinaturas e cadeias de delegação do UCAN. Caso seja válido, o Key Vault entrega as [[chave-de-epoca|**Chaves de Época**]] (AES-256) correspondentes apenas aos payloads solicitados pela query, garantindo que quem fornece o dado esteja plenamente amparado pelas credenciais anexadas.

### 2.2.1 Predicado de Bloqueio na Liberação (v4)

> Conceito canônico: [[predicado-de-bloqueio]]

A chave nunca está no asset; o asset/UCAN é o **direito de pedir**, e o Key Vault valida antes de liberar. A v4 acrescenta um predicado à decisão de liberação: **"libera a chave de época se o solicitante NÃO está na lista de bloqueio do autor"** (arestas [[blocks-aresta|`BLOCKS`]] do autor). Isso **substitui o mecanismo anterior de rotação-de-época-como-bloqueio** (ver RFC v4 §2.8) — antes era necessário rotacionar a época para expulsar alguém; agora basta adicionar à lista `BLOCKS`.

* **Custo de revogação:** O(1 pedido negado); a latência efetiva do bloqueio é o **TTL da chave em RAM** (§3.1), sem rotação de época.
* **Privacidade do bloqueio:** no caso de audiência limitada (DM, seguidores), o emissor da chave pode ser o **próprio agente do autor**, de modo que a lista de bloqueio nunca sai dele.
* **Limite ([[honestidade-radical|honestidade radical]] — ver §5.1):** bloqueio é criptográfico apenas contra o bloqueado **agindo sozinho**; sua força é inversamente proporcional ao número de detentores-de-chave dispostos a cooperar — i.e., ao tamanho da audiência. Para conteúdo **público** (chave universal), o bloqueio é [[bloqueio-social|**social**]] (filtro de leitura sobre `BLOCKS`), não criptográfico.

* **Invariante de Validação de Consentimento**: A presença de qualquer aresta que aponte para um nó do tipo `ASSET:CONSENT`, ou que cubra um nó do tipo `CONTENT:PERSONAL_DATA` dentro do subgrafo de traversal solicitado, **rebaixa automaticamente o tier mínimo de TTL** permitido na emissão do UCAN correspondente. Qualquer solicitação de emissão de um UCAN com TTL de criticidade 'Baixa' (infinito/longo) que cubra escopos relacionados a consentimento ou dados pessoais é **expressamente rejeitada e barrada pelo [[zen-engine|Zen Engine]]**.
  * **Otimização de Processamento (Single-Pass Validation)**: Para evitar custos computacionais duplicados, a checagem de consentimento (verificando os tipos de nós alcançados) e a validação do `edge_filter` (whitelist do T3) ocorrem em um **único passo unificado** no momento da emissão do UCAN, resolvendo a query de traversal correspondente uma única vez.
* **Delegação Recursiva**: UCANs permitem delegação em cascata (A delega para B, que delega para C, dentro dos mesmos limites de traversal). O criador do recurso ou a especificação governante pode desativar a delegação recursiva via atributo `delegatable: false`.
* **Revogação**: Realizada gravando-se uma lápide (aresta de revogação com `active = 0` ou aresta de expiração) no grafo.

---

## 3. Hierarquia Criptográfica e Imutabilidade Dupla

Para assegurar a soberania dos dados locais e forward secrecy contra revogações, o sistema adota chaves de época integradas a um modelo rigoroso de imutabilidade.

### 3.1 As Camadas de Chaves

> Conceitos canônicos: [[chave-mestra-ed25519]] · [[chave-de-epoca]]

* **Chave Mestra (Ed25519)**: Armazenada de forma inviolável no Secure Enclave ou Keychain do dispositivo local. Usada para assinar nós/arestas emitidos e assinar tokens UCAN locais.
* **Chave do Dispositivo (AES-256)**: Derivada localmente via KDF (Key Derivation Function). Usada para encriptar localmente tabelas de projeção de texto plano (como índices de busca SQLite FTS5) e metadados. Nunca é exposta na rede.
* **Chave de Conteúdo por Época (AES-256-GCM)**: Custodiada no Cofre de Chaves (Key Vault). Cifra payloads binários de nós e payloads sensíveis de arestas de um grupo ou documento.
* **Cache de RAM (Volátil)**: Cache em memória RAM da chave de época descriptografada pelo Key Vault, com expiração padrão (TTL) de 4 horas, para evitar chamadas de descriptografia contínuas na projeção reativa do TinyBase.

#### 3.1.1 Época de Identidade vs. Épocas de Conteúdo

> **Normativo (RFC-005 §A.1).** Duas camadas de época, ortogonais e com ciclos de vida independentes. Ver [[epoca-de-identidade]] e [[chave-de-epoca]].

1. **Época de Identidade (`identity_epoch_index`, escalar por identidade/dispositivo).** Versiona o estado de atestação da identidade: cadeia de UCANs raiz, delegações de dispositivo (§1.4, §1.7) e material de chaves de identidade. É o **único** índice trocado no handshake Noise_XX (§1.4.1) e nos envelopes do wire protocol ([[caderno-2-protocol/05-wire-protocol]]). Divergência não derruba a conexão — desvia para o Catch-up de Identidades (Onda 0). **Eventos que incrementam (lista fechada):** rotação/substituição da chave mestra ou de persona; revogação de UCAN raiz; emissão ou revogação de delegação de dispositivo; mudança em modelo de recuperação que altere material público verificável.
2. **Épocas de Conteúdo (escopadas por permissão).** Chaves AES-256-GCM de payload pertencem aos subgrafos; cada `ASSET:PERMISSION`/grupo tem sua própria linhagem de épocas (§3.3). **Nunca** transitam nem são avaliadas no handshake; são obtidas sob demanda do Key Vault pelo fluxo capability-based (§3.3.2).

**Consequência:** `STALE_EPOCH` no wire protocol refere-se exclusivamente à Época de Identidade. Divergência de época de conteúdo manifesta-se como negativa do Key Vault ou payload ilegível pendente de reidratação de chave, na camada de aplicação.

### 3.2 Duas Camadas de Imutabilidade (Linhagem de Versões)

> Conceitos canônicos: [[imutabilidade-dupla]] · [[linhagem-de-versoes]] · [[mutates]]

Toda entidade no grafo (linha temporal de modificações conectada pelo mesmo `entity_id`) é auditada em dois níveis:
1. **Imutabilidade do Registro (Layer 1)**: Cada nó e aresta individual possui uma assinatura digital Ed25519 universal cobrindo todos os seus campos planos e o payload cifrado.
2. **Imutabilidade da Ordem (Layer 2)**: Para impedir ataques de reordenação histórica ou exclusão silenciosa de elos da linhagem, toda aresta `MUTATES` que conecta uma versão nova à anterior carrega uma coluna unencriptada chamada **`previous_hash`**.
   * O `previous_hash` aponta diretamente para o hash da assinatura Ed25519 da aresta `MUTATES` anterior.
   * O `previous_hash` é uma coluna plana, plana indexada, permitindo auditorias topológicas rápidas em $O(1)$ sem a necessidade de descriptografar os payloads cifrados dos nós.
   * Esse campo reside exclusivamente na estrutura da aresta `MUTATES`, tendo sido removido de dentro dos payloads dos nós-versão para evitar redundância e contaminação de escopo.

### 3.3 Rotação de Épocas e Forward Secrecy

> Conceito canônico: [[rotacao-de-epocas]]

Quando um membro ou papel é revogado de um grupo/documento:
1. O Cofre de Chaves (Key Vault) do grupo (gerido cooperativamente pelos validadores ou via KMS online-optional) gera uma nova chave AES para uma **nova época**.
2. A nova chave é **disponibilizada via Key Vault de Rede** (§3.3.2) exclusivamente aos participantes cujos UCANs correspondentes à `ASSET:PERMISSION` ou `ASSET:ROLE` continuam ativos — **uma** operação por escopo, não N envelopes por dispositivo.
3. Quaisquer novos nós ou arestas gravados a partir desse instante usam a chave da nova época.
4. O membro excluído perde o acesso às chaves das novas épocas. Contudo, mantém acesso aos dados históricos cifrados com chaves das épocas em que era participante (preservando o forward secrecy pragmático).
*   **Acesso pós-rotação offline**: Há uma distinção importante: **`UCAN válido offline` $\neq$ `acesso ao conteúdo pós-rotação`**. Se a chave de época rotacionar enquanto um dispositivo com UCAN válido está offline, o dispositivo conseguirá ler todo o histórico anterior criptografado com as chaves de época antigas que ele possui localmente. No entanto, ele **não conseguirá descriptografar os novos nós** gravados na época recente até que restabeleça a conexão de rede para obter e reidratar a nova chave criptografada correspondente.

### 3.3.1 Rotação Cooperativa de Época de Grupo em P2P Puro

Sem autoridade declarada (KMS/super peer), a coordenação é determinística (não BFT; pressupõe membros já em confiança via [[ucan]]):

1. **Anel:** Os [[agente-de-sistema]] dos membros **online** são ordenados por menor `entity_id` (a mesma eleição de committer de caderno-2/04 §4); o menor lidera o ciclo.
2. **Geração:** O líder gera a nova chave de época localmente.
3. **Disponibilização:** A nova chave é publicada conforme §3.3.2 (modelo direto via `requestEpochKey` no Key Vault de Rede; ou KEK por escopo na variante opcional), gated por UCAN + delegação, executando **uma** operação por escopo, em vez de N envelopes por dispositivo.
4. **Ata:** O líder emite **um** nó `CONTENT` governado por `SPECIFICATION:EPOCH_ROTATION`, com o payload `{ scope, new_epoch_index, hlc, envelope_id? }` (o `envelope_id` está presente apenas na variante KEK). Qualquer membro audita que a rotação ocorreu e que o acesso está disponível ao conjunto autorizado.
5. **Falha do líder:** O anel se reordena; qualquer membro inicia um novo ciclo se o líder vigente estagnar. Até lá, a época corrente segue válida; expirado o TTL sem rotação, o escopo degrada a read-only para novos conteúdos ([[congelamento-escopado|freeze escopado]]).

**Limites declarados (Rotação Cooperativa):** Um líder malicioso pode apenas **atrasar** a rotação (mitigado por reeleição imediata) ou **omitir** a disponibilização a um membro específico (fato detectável pela ata; o membro omitido reivindica pelo canal de rede). Ele não consegue forjar a chave de outros membros nem ler o que não lhe cabe por especificação.

### 3.3.2 Re-entrega de Chave de Época a Dispositivos Delegados (Key Vault de Rede)

> **Normativo (RFC-005 §A.12).** Resolve o caso do dispositivo recém-pareado (com delegação, sem a chave privada da persona) que precisa ler o histórico. Esta seção **substitui qualquer menção anterior a "envelopes por dispositivo"** e ao submecanismo `K_df`/envelope público (construção descartada por inversão de key-wrapping — a KEK era derivada da própria chave que embrulhava; ver a Caixa de Revisão da RFC-005). Modelo adotado: **direto** (recomendado pela RFC-005); a variante KEK permanece registrada como opcional.

**Modelo direto (adotado):**

* Cada escopo mantém sua linhagem de chaves de época (§3.3).
* O **Key Vault de Rede** expõe `requestEpochKey(ucan, scope, prova_de_delegação) → chave_de_época | DENIED`. Valida: cadeia UCAN do escopo, `DELEGATED_TO` ligando a chave do dispositivo a uma persona membro, predicado `BLOCKS`, frescor da Época de Identidade (§3.1.1). Retorna a chave da época corrente (e, sob pedido, épocas anteriores a que o membro tem direito, para histórico). Trafega **dentro** do canal Noise.
* A API interna `requestKey(scope)` (consumo do Sync Worker local para decifrar payloads) permanece e **nunca** é exposta a peers remotos.
* **Hot start natural:** o dispositivo novo sincroniza o grafo (RBSR), chama `requestEpochKey` com sua delegação, recebe a chave, lê. Sem transferência especial; a pré-carga no passo 5 da cerimônia QR (§1.7) é só otimização.
* **Revogação sem urgência (perda, não comprometimento):** revogar o UCAN do dispositivo (lápide em `DELEGATED_TO` + bump de Época de Identidade). O Key Vault nega pedidos futuros; a chave em cache vale até o TTL de 4 h; novas rotações ficam ilegíveis ao dispositivo.
* **Revogação com urgência (comprometimento):** o acima **+** rotação imediata da época nos escopos afetados (custo apenas quando o risco justifica).
* **O(1):** uma chave de época por escopo, não pré-embrulhada por dispositivo.
* **Limite honesto P2P puro:** sem nenhum peer online com a chave, o dispositivo novo não a obtém até alguém reconectar (limite de liveness de qualquer P2P). Na modalidade gerida, o peer do sistema elimina esse limite.

**Variante KEK (opcional, só se medir gargalo de round-trip):** define-se uma **KEK por escopo, independente de qualquer chave de época**, detida/derivável só pelo Key Vault e (após buscada) pelos membros autorizados. Cada nova chave de época é embrulhada sob a KEK e publicada como `CONTENT:EPOCH_ENVELOPE` (público, RBSR). O membro busca a KEK **uma vez** (gated por UCAN + delegação) e desembrulha todas as rotações futuras localmente, com zero round-trip por rotação. **Trade-off real:** vazamento da KEK expõe as épocas embrulhadas sob ela ⇒ rotacionar a KEK (nova KEK, re-embrulhar a época corrente) e, para forward secrecy do vazamento, rotacionar também a época. Bounded e explícito.

### 3.4 Custódia Cega: Archive Cargo (encomenda cifrada)

Mecanismo canônico completo em [[custodia-cega-archive]] — empacotamento e cifragem com a [[chave-de-epoca]] do escopo, registro via `SPECIFICATION:ARCHIVE_MANIFEST`, entrega por canal `EPHEMERAL`, recuperação self-certifying, GC por `expires_at` e integração com a poda (G4/T-806: nunca reduzir cópias íntegras abaixo de N=3).

**Reuso maximal (ângulo de protocolo):** [[chave-de-epoca|chaves de época]] existentes (zero cripto nova); SPECIFICATION como governança (zero [[ucan]] novo); `EPHEMERAL` + `device_state.db` (zero canal novo); [[consistent-hashing|consistent hashing]] (zero algoritmo novo); `CONTENT` genérico (zero tipo ontológico novo).

### 3.5 KMS Online-Optional e Conectividade
* **Modo Online**: Com conectividade ativa, a rotação de chaves e revogação de UCANs se propagam instantaneamente na rede.
* **Modo Offline**: Em redes P2P puras ou dispositivos temporariamente isolados, a rotação de chaves é enfileirada localmente e as chaves de nova época são geradas de forma descentralizada e consolidadas de forma assíncrona assim que ocorre a reconexão e reconciliação de estado.

### 3.6 Ordenação Causal, HLC e Seleção de Head

> Conceitos canônicos: [[hlc]] · [[head]]

#### 3.6.1 Definição de Head
O **head** de uma entidade é a **ponta (tip) da linhagem**: o nó-versão do qual nenhuma aresta `MUTATES` ativa parte (ou seja, ninguém mutou a partir dele). **Não** é "o nó de maior `created_at`" — esse critério, baseado em relógio de parede, está sujeito a skew e à manipulação do autor.

Operacionalmente, head = nó-versão de **maior HLC** da entidade. Isso é equivalente à definição estrutural acima **por causa** da invariante de monotonicidade (§3.6.4): se todo filho tem HLC maior que o pai, o nó de maior HLC nunca pode ter um descendente — logo é sempre uma ponta.

#### 3.6.2 Estrutura do HLC
Cada nó/aresta carrega um carimbo `hlc = (pt, c)`:
* `pt` — componente físico em ms (colado ao tempo real; serve para display e janelas temporais).
* `c` — contador lógico (16 bits) que desempata eventos no mesmo `pt`.

Empacotamento: `hlc = (pt << 16) | c`, armazenado como inteiro e **coberto pela assinatura Ed25519**.

#### 3.6.3 Algoritmo de Atualização
Estado por peer: `L = (pt, c)`.

```
// Evento local (criar nó-versão / emitir aresta)
pt_old = pt
pt = max(pt_old, wall_clock_ms())
c  = (pt == pt_old) ? c + 1 : 0
stamp = (pt, c)

// Recepção de carimbo remoto (pt_m, c_m)
pt_old = pt
pt = max(pt_old, pt_m, wall_clock_ms())
if      (pt == pt_old && pt == pt_m) c = max(c, c_m) + 1
else if (pt == pt_old)               c = c + 1
else if (pt == pt_m)                 c = c_m + 1
else                                 c = 0
```

Ordem total determinística (idêntica em todos os peers, sem coordenação):
`compare = (a.pt vs b.pt) ?: (a.c vs b.c) ?: (a.author_pubkey vs b.author_pubkey)`.

Garantia: se `e1 → e2` (causal), então `HLC(e1) < HLC(e2)`. A recíproca **não** vale: HLC ordena, mas **não detecta concorrência** — a [[fork-resolucao|detecção de fork]] é estrutural (duas `MUTATES` ativas com o mesmo `source_id`; ver caderno-2/04 §3.2). Dentro de documentos colaborativos, a concorrência granular é resolvida pelo Automerge, não pelo HLC.

#### 3.6.4 Invariantes de Validação na Recepção
1. **Monotonicidade de pai:** um nó que faz `MUTATES` de um pai `P` é **rejeitado como malformado** se `HLC(filho) ≤ HLC(P)`. Isso impede pós-datar para "voltar no tempo" da linhagem e é o que sustenta a equivalência de §3.6.1.
2. **Limite de drift:** se `pt_remoto > wall_clock_local + MAX_DRIFT` (ex.: 5 min), o valor **não** é adotado no `max` do relógio local e o nó entra em quarentena até estar na janela. Isso limita o ataque de "HLC futuro-distante" a `MAX_DRIFT`, em vez de poluir o relógio de toda a malha.

---

## 4. Modelos de Recuperação de Chaves (Custódia e Backup)

A plataforma disponibiliza três modelos de recuperação de acesso à conta, configuráveis na [[specification-network-governance|`SPECIFICATION:NETWORK_GOVERNANCE`]] de cada rede:

### 4.1 Modelo Centralizado (Central Custody)
* **Público**: Recomendado para [[rede-corporativa-whitelabel|Redes Corporativas Whitelabel]].
* **Funcionamento**: A chave mestra do funcionário é gerada no provisionamento e encriptada com a chave mestra da empresa. O administrador da empresa pode resetar credenciais e restaurar acesso sob demanda.
* **Limitação**: A empresa possui a capacidade técnica de ler e auditar as mensagens assinadas pelo funcionário, fato comunicado contratualmente no onboarding.

#### 4.1.1 Autenticação Corporativa sem SSO (usuário/senha + e‑mail + 2FA)

Nem toda rede corporativa tem SSO. O modelo convencional mapeia no Central Custody **sem mecanismo novo**:

- **Senha não é a identidade.** A identidade continua sendo Ed25519. A senha é o **fator de desbloqueio**: deriva (PBKDF2) a chave que decifra o material local. Preserva a separação que o resto do sistema depende.
- **Recuperação por e‑mail = Central Custody:** a chave mestra do funcionário fica cifrada sob a chave da empresa no [[peer-do-sistema|peer do sistema]]; o admin reseta. Exige um canal SMTP (ver caderno‑3/06) — dependência do papel de peer do sistema.
- **2FA:** fator adicional sobre o desbloqueio local; não toca o grafo nem a cripto de conteúdo.

Limite honesto inalterado: no Central Custody a empresa tem capacidade técnica de ler o que o funcionário assina (comunicado contratualmente no onboarding).

### 4.2 Modelo Shamir (SSS 2-de-3)
* **Público**: Recomendado para Redes Públicas.
* **Funcionamento**: A chave mestra do usuário é dividida matematicamente em 3 shards usando Shamir's Secret Sharing (SSS) sobre $GF(2^8)$. São necessários no mínimo 2 shards para reconstruir a chave.
  * **Shard 1 (Dispositivo)**: Salvo no storage seguro local do celular/workstation.
  * **Shard 2 (Cofre do Provedor)**: Protegido pelo hash da senha do usuário nos servidores do fundador.
  * **Shard 3 (Canal Externo)**: Token ou segredo enviado via e-mail/SMS/Authenticator externo.
* **Segurança**: O comprometimento isolado de um único canal ou dispositivo não compromete a identidade do usuário.

### 4.3 Modelo Soberano (User Only)
* **Público**: Recomendado para Redes P2P Puras.
* **Funcionamento**: A chave é gerada a partir de uma semente mnemônica de 12 ou 24 palavras (BIP39). O usuário é o único detentor do segredo.
* **Risco**: A perda da semente resulta em perda definitiva da identidade e dos dados encriptados.

---

## 5. Limites Honestos: Riscos Aceitos (Não Controlados)

### 5.1 Trava de Visualização ≠ Enforcement

Na UI, uma trava visual ("este conteúdo é privado / bloqueado") é **cortesia do cliente, não enforcement criptográfico**.

- **No P2P puro (cliente potencialmente modificado):** A trava vale zero contra um peer com a chave em mãos; é cortesia de cliente honesto. Privacidade real vem só do tier de chave (quem tem a chave, acessa; quem não tem, não).
- **No tier público (chave universal):** A trava é a **única ferramenta** (filtro social em UI, não cripto); é inerentemente social, não material.

**Risco aceito:** Um cliente ou peer adversário pode descriptografar e exibir conteúdo mesmo que a UI o marque como travado. Janela de privacidade = time-to-chave (quanto tempo leva para o peer adversário obter ou derivar a chave).

### 5.2 Expurgo (Revogação por Cortesia) ≠ Revogação Criptográfica

> Conceito canônico: [[revogacao-por-cortesia]]

**Mecanismo:** Um sinal de revogação (`retention_state = expunged`, lápide, caderno-3/01 §2.2) é propagado aos peers cooperativos. Peers honrados setam `retention_state = expunged`, descartando localmente o plaintext (se consentimento de privacidade foi revogado) ou o inteiro registro (se conteúdo foi deletado pelo autor).

**Limite honesto:**
- Um único detentor **não-cooperativo** que já decifrou o plaintext **retém para sempre** (não há "desver"). Pior para conteúdo publicado sob chave universal (tier público).
- **Vazamento de metadado:** O próprio sinal de expurgo revela "X virou privado / Y foi bloqueado". Mais forte em contexto com autoridade (super peer pode simplesmente deixar de servir); mais fraco em P2P puro.

**Risco aceito:** Revogação de privacidade é best-effort, não garantida. Apropriado para regimes de contrato (consentimento revogável em GDPR), não para dados já públicos.

---


