# Custódia Cega (Archive Cargo)

A **Custódia Cega** (implementada através do mecanismo de **Archive Cargo**) viabiliza a disponibilidade de subgrafos da rede sem expor a semântica ou o conteúdo das transações ao peer custodiante. Resolve a tensão entre a sincronização restrita ao escopo de [[ucan]] e a exigência de fator de replicação $N \ge 3$, especialmente quando a audiência legítima do subgrafo é menor que $N$.

## Funcionamento Técnico

1. **Empacotamento e Cifragem:** O [[agente-de-sistema]] (`PROFILE:SYSTEM`) emissor serializa um lote de nós e arestas pertencentes a uma **única época**, compacta os dados (utilizando zstd) e cifra o pacote usando a [[chave-de-epoca]] do escopo correspondente (AES-256-GCM) — a mesma chave utilizada para os payloads individuais. Com isso, o custodiante **não valida assinaturas, não visualiza chaves públicas e não aprende a autoria** dos registros.
2. **Registro no Grafo:** É gerado um identificador único para o pacote:
   $$\text{archive\_id} = \text{blake2s256}(\text{ciphertext})$$
   Um nó de conteúdo (`CONTENT`) governado pela especificação `SPECIFICATION:ARCHIVE_MANIFEST` é criado contendo o payload:
   ```json
   {
     "archive_id": "...",
     "blind_scope_id": "...",
     "epoch_index": 0,
     "hlc_range": "...",
     "size": 0,
     "expires_at": "..."
   }
   ```
   As arestas do tipo `ARCHIVES` ligando o manifesto aos nós originais empacotados são governadas pelo sync restrito por [[ucan]] (T-305) — impossibilitando que peers sem o [[ucan]] correspondente as visualizem.
3. **Armazenamento Descentralizado:** O emissor transmite o `ciphertext` aos custodiantes utilizando um canal de dados temporário (`EPHEMERAL`), fora do mecanismo padrão de reconciliação (RBSR). O custodiante armazena o pacote em seu banco local secundário `device_state.db` (tabela `blind_archives`, **nunca** no grafo replicado), indexado pelo `archive_id`. A atribuição de custodiantes é feita via *consistent hashing* sobre o `blind_scope_id` no anel de custódia (idêntico ao mecanismo de BLOBs), operando sem um coordenador centralizado.
4. **Recuperação e Validação:** Um peer autorizado requisita o arquivo enviando o `archive_id`. O custodiante retorna o `ciphertext` e o requisitante decifra os dados localmente usando a [[chave-de-epoca]] obtida do Key Vault de Rede. A integridade é *self-certifying*: o hash `blake2s256(ciphertext)` deve coincidir com o `archive_id` e a tag de integridade do GCM deve validar com sucesso.
5. **Garbage Collection (Poda):** O campo `expires_at` possibilita o descarte de pacotes expirados sem necessidade de coordenação activa; a renovação do ciclo de vida ocorre via novas mensagens `EPHEMERAL` contendo o mesmo `archive_id`.

## Integração com a Poda Segura

O Archive Cargo atua como garantidor do Replication Factor mínimo ($N \ge 3$) exigido pelo Garbage Collector híbrido (G4). Um nó-versão só é podado (convertido para o estado de casca/pruned) no banco SQLite local após a confirmação (via protocolo RELEASE/ACK e health-check do T-806) de que pelo menos $N$ custodiantes possuem de forma persistente o archive contendo o referido nó.

## Limites Honestos e Riscos Aceitos

* **Vazamento de Metadados de Tráfego:** Embora o custodiante cego não aprenda o conteúdo das mensagens ou a autoria dos nós, ele observa metadados estruturais como `blind_scope_id`, a faixa de relógio lógico (`hlc_range`), o tamanho do arquivo (`size`), a data de expiração (`expires_at`) e quais `DevicePeerId` interagem (enviando ou buscando) com cada archive. A correlação de co-busca por múltiplos dispositivos permite inferir e agrupar dispositivos em torno de escopos compartilhados, gerando um grafo social parcial do sistema.
* **Vulnerabilidade a Spam (Armazenamento Abusivo):** Pelo fato de o custodiante não possuir a chave de decifragem e não poder validar a semântica ou legitimidade do subgrafo antes de armazená-lo, a defesa contra ataques de negação de serviço ou exaustão de armazenamento é estritamente de natureza econômica e de reputação. O controle é feito aplicando quotas por `DevicePeerId` emissor e por `blind_scope_id`, com base em reputação acumulada (*standing*), e não por validação criptográfica do conteúdo.
