# Mapa de conceitos (MOC)

Índice dos verbetes canônicos. Cada conceito é definido UMA vez em `conceitos/`.
Os cadernos linkam para cá via [[slug]]; nunca redefinem.

## Identificadores e Ordenação

| verbete | título | tags |
|:---|:---|:---|
| [[ulid]] | ULID (Universally Unique Lexicographically Sortable Identifier) | protocol, identificadores |
| [[id]] | Campo id (identificador de versão de nó) | protocol, identificadores |
| [[entity-id]] | entity_id (identificador de entidade) | protocol, identificadores, linhagem |
| [[hlc]] | Hybrid Logical Clock (HLC) | protocol, temporal-ordering, sync, linhagem |

## Identidade e Criptografia

| verbete | título | tags |
|:---|:---|:---|
| [[chave-mestra-ed25519]] | Chave Mestra Ed25519 | protocol, criptografia, identidade |
| [[chave-de-epoca]] | Chave de Época (Epoch Key) | protocol, criptografia, acesso, forward-secrecy |

## Placeholders (dependências declaradas, verbetes pendentes)

| verbete | título |
|:---|:---|
| [[linhagem-de-versoes]] | Linhagem de Versões |
| [[head]] | Head (ponta da linhagem) |
| [[mutates]] | MUTATES (aresta de linhagem) |
| [[chave-de-epoca]] | Chave de Época (AES-256-GCM) |
| [[peer-id]] | PeerId |
| [[key-vault]] | Key Vault (Cofre de Chaves) |
| [[profile-authentication]] | PROFILE:AUTHENTICATION (Identidade-Âncora) |
| [[asset-permission]] | ASSET:PERMISSION |
| [[rotacao-de-epocas]] | Rotação de Épocas |

