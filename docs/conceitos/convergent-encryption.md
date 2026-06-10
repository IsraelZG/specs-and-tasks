---
title: Convergent Encryption
slug: convergent-encryption
aliases:
  - Convergent Encryption
  - modo convergent
  - criptografia convergente
tags:
  - sdk
  - security
  - media
  - canonical
  - onda-11
modo: canonical
fonte-canonica: docs/caderno-3-sdk/05-media-transport-plane.md §3.2
aparicoes-consolidadas:
  - docs/glossary.md §Convergent Encryption (modo convergent)
dependencias:
  - [[specification]]
  - [[profile-system]]
  - [[agente-de-sistema]]
  - [[key-vault]]
  - [[ucan]]
  - [[chave-de-epoca]]
---

# Convergent Encryption

## Definição

**Convergent Encryption** (modo `convergent` ou **criptografia convergente**) é a técnica na qual a chave simétrica de cifra deriva de forma determinística do próprio conteúdo. Isso garante que plaintexts idênticos produzam ciphertexts idênticos, viabilizando a deduplicação física na camada de armazenamento e transporte (geração de um mesmo `InfoHash` ou CID). Na plataforma, este modo é contraposto ao modo `unique` (chave independente por arquivo) e é restrito a modalidades geridas devido ao risco de ataque de confirmação de arquivo (*confirmation‑of‑file attack*).

## Por quê → [[caderno-1-vision]]

A plataforma visa equilibrar privacidade e eficiência de rede conforme a modalidade de rede adotada (ver [[modalidade-de-rede]] <!-- Foam placeholder — Onda 12 -->). Em redes geridas (corporativas e públicas), a eficiência do armazenamento e transporte via deduplicação é priorizada, justificando o uso do modo `convergent`. Em redes P2P puras, a privacidade contra análise de tráfego e ataques de adivinhação de conteúdo é soberana, exigindo o modo `unique` sem deduplicação. Ver `caderno-1-vision/01-vision-and-positioning.md §4` e `caderno-3-sdk/05-media-transport-plane.md §9`.

## Contrato → [[caderno-2-protocol]]

A especificação de mídia (`SPECIFICATION:MEDIA_DELIVERY`) governa os parâmetros criptográficos e de entrega de arquivos (ver [[specification]]). O controle de acesso ao conteúdo e o transporte de chaves são ortogonais ao modo de cifragem: a chave simétrica resultante é empacotada na chave de época da audiência e distribuída pelo [[key-vault]] após validação de capacidades [[ucan]]. Isso garante que mesmo no modo convergente (onde o ciphertext é público ou compartilhado no swarm), apenas peers autorizados consigam decifrar os chunks. Ver `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2` e `caderno-3-sdk/05-media-transport-plane.md §3.4`.

## Implementação → [[caderno-3-sdk]]

O comportamento detalhado de geração de chaves e de cifras para transporte de mídia está definido em [`caderno-3-sdk/05-media-transport-plane.md §3.2`](../caderno-3-sdk/05-media-transport-plane.md).

### Algoritmo e Derivação de Chaves

A especificação suporta dois modos de chave de criptografia declarados na configuração de entrega do asset (`dedup_mode`):

#### 1. Modo `convergent` (com deduplicação)
- **Derivação da Chave:** A chave deriva do próprio plaintext, utilizando um segredo de rede (`salt_rede`) mantido pelo [[agente-de-sistema]] para escopar a deduplicação à rede (evitando vazamento cruzado entre redes distintas):
  ```
  K_content = HKDF(salt_rede, H(plaintext_canônico), "blob-convergent-v1")  // 32 bytes
  ```
- **Nonce determinístico:** Para evitar o *forbidden attack* do AES-GCM (reuso de nonce com a mesma chave), o nonce para cada chunk $i$ é calculado de forma determinística:
  ```
  nonce_i = fixed_field(8B) ‖ counter_i(4B big‑endian)
  ```
  onde `fixed_field = H(plaintext_canônico)[:8]` e `counter_i = i` (índice do chunk). É matematicamente seguro porque:
  - Se os conteúdos forem diferentes $\Rightarrow$ a chave `K_content` e o `fixed_field` serão diferentes.
  - Se o conteúdo for idêntico $\Rightarrow$ o ciphertext será idêntico, cumprindo o objetivo de deduplicação física no swarm.
- **Coordenação:** O upload e a geração de chunks/chaves no modo convergente são coordenados pelo [[agente-de-sistema]] (`PROFILE:SYSTEM` / [[profile-system]]), que aplica o `salt_rede` consistente e checa se o `InfoHash` do ciphertext já existe no storage antes de iniciar o upload.

#### 2. Modo `unique` (sem deduplicação)
- **Derivação da Chave:** Chave única por arquivo, desvinculada do conteúdo, gerada a partir da chave de época do publicador:
  ```
  K_file = HKDF(epoch_key, file_entity_id, "blob-unique-v1")  // 32 bytes
  ```
- **Nonce:** `fixed_field` aleatório por arquivo `‖ counter_i`.
- **Consequência:** Conteúdos idênticos cifrados por autores diferentes geram ciphertexts e `InfoHash` totalmente distintos. Não há deduplicação, prevenindo completamente ataques de confirmação de arquivos (máxima privacidade).

---

## Evolução → [[caderno-4-governance]]

O design prevê que a transição de parâmetros criptográficos, como a alteração do algoritmo de hash base ($H$) ou do KDF, seja governada por atualizações na especificação de governança de rede (`SPECIFICATION:MEDIA_DELIVERY`), assegurando a retrocompatibilidade com ciphertexts antigos através do versionamento semântico de manifestos (ver [[specification]]).

## Aparições a consolidar

- `docs/glossary.md §Convergent Encryption (modo convergent)` — definição resumida em uma linha; consolidada neste verbete.
- `docs/caderno-3-sdk/05-media-transport-plane.md §3.2` — seção original movida literalmente para este verbete e substituída por referências e link direto para manter a fonte canônica única.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[specification]] | 1 | criado |
| [[profile-system]] | 3 | criado |
| [[agente-de-sistema]] | 10 | criado |
| [[key-vault]] | 2 | criado |
| [[ucan]] | 2 | criado |
| [[chave-de-epoca]] | 1 | criado |
| [[modalidade-de-rede]] | 12 | <!-- Foam placeholder — Onda 12 (futura) --> |
