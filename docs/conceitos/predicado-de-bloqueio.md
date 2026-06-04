---
name: predicado-de-bloqueio
title: "Predicado de Bloqueio"
aliases: ["predicado de bloqueio na liberação", "blocking predicate"]
tags: [protocol, identidade, criptografia, controle-de-acesso, bloqueio-social, v4]
---

# Predicado de Bloqueio

O predicado de bloqueio é a condição lógica avaliada pelo [[key-vault]] no momento de decidir se libera ou nega uma [[chave-de-epoca]] a um solicitante. Introduzido na v4, ele substitui o mecanismo anterior de [[rotacao-de-epocas]] como forma de bloquear acesso. A regra canônica é: **"libera a chave de época se o solicitante NÃO está na lista de bloqueio do autor"** — implementada pelas arestas [[blocks-aresta]] (`BLOCKS`) do autor.

## Definição

Conforme `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2.1`:

> A v4 acrescenta um predicado à decisão de liberação: **"libera a chave de época se o solicitante NÃO está na lista de bloqueio do autor"** (arestas `BLOCKS` do autor). Isso **substitui o mecanismo anterior de rotação-de-época-como-bloqueio** — antes era necessário rotacionar a época para expulsar alguém; agora basta adicionar à lista `BLOCKS`.
>
> * **Custo de revogação:** O(1 pedido negado); a latência efetiva do bloqueio é o **TTL da chave em RAM** (§3.1), sem rotação de época.
> * **Privacidade do bloqueio:** no caso de audiência limitada (DM, seguidores), o emissor da chave pode ser o **próprio agente do autor**, de modo que a lista de bloqueio nunca sai dele.
> * **Limite (honestidade radical — ver §5.1):** bloqueio é criptográfico apenas contra o bloqueado **agindo sozinho**; sua força é inversamente proporcional ao número de detentores-de-chave dispostos a cooperar — i.e., ao tamanho da audiência. Para conteúdo **público** (chave universal), o bloqueio é **social** (filtro de leitura sobre `BLOCKS`), não criptográfico.

## Contexto no fluxo de acesso

O predicado opera dentro do fluxo de acesso inverso (capabilities-based) descrito em `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2`:

> A chave nunca está no asset; o asset/UCAN é o **direito de pedir**, e o Key Vault valida antes de liberar.

O predicado de bloqueio é a verificação adicional inserida após a validação criptográfica do [[ucan]]: mesmo com um UCAN válido, o solicitante é negado se existir uma aresta `BLOCKS` do autor apontando para ele.

Conforme `rfc-v4.md §2.8`:

> Mecanismo (refina o fluxo inverso da v3.1 §2.2): a chave nunca está no asset; o asset/UCAN é o **direito de pedir**, e o Key Vault valida antes de liberar. A v4 adiciona um **predicado de bloqueio** à liberação ("libera se o solicitante não está na lista de bloqueio do autor"). Ganho: revogação O(1 pedido negado), latência = TTL da chave em RAM, **sem rotação de época**. No caso privado, o emissor da chave pode ser o próprio agente do autor → a lista de bloqueio nunca sai dele.

## Força do bloqueio por tipo de audiência

A eficácia criptográfica do predicado depende do escopo da audiência. O princípio normativo, conforme `rfc-v4.md §2.8`:

> *privacidade criptográfica exige audiência limitada; conteúdo público recebe apenas bloqueio social.*

| Audiência | Força do bloqueio | Mecanismo |
| :--- | :--- | :--- |
| **DM** (2 pessoas) | E2E forte | Chave de época por grupo de 2 |
| **Seguidores de X** (perfil privado) | **Criptográfico** | Chave-na-emissão com predicado + TTL |
| **Feed Público** | **Social** — não é garantia criptográfica | Filtro de leitura sobre arestas `BLOCKS` na montagem do feed |

Para conteúdo público (chave universal), o predicado não pode ser criptográfico: uma chave em milhões de mãos é trivialmente redistribuída a um bloqueado, e tornar a chave escassa por-espectador forçaria um custódio online por leitura, contradizendo a tese [[local-first]]/P2P. Nesses casos o bloqueio é [[bloqueio-social]].

## Substituição do mecanismo de rotação-de-época

Antes da v4, o mecanismo de bloqueio exigia [[rotacao-de-epocas]]: para expulsar alguém do acesso, o autor precisava rotacionar a chave de época e redistribuir para todos os *outros* participantes legítimos — operação O(n audiência). O predicado de bloqueio reduz o custo a O(1): basta adicionar a aresta `BLOCKS` e o Key Vault passa a negar o solicitante a cada pedido.

A latência efetiva do bloqueio é o TTL da chave em RAM (ver `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.1`): o solicitante já bloqueado que ainda tem a chave em cache pode usá-la até o TTL expirar; após isso, o próximo pedido ao Key Vault é negado pelo predicado.

## Limites honestos

Conforme `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2.1`:

> bloqueio é criptográfico apenas contra o bloqueado **agindo sozinho**; sua força é inversamente proporcional ao número de detentores-de-chave dispostos a cooperar — i.e., ao tamanho da audiência.

Um insider com a chave em mãos pode repasse-la ao bloqueado sem passar pelo Key Vault. O predicado não pode impedir esse cenário — conforme o princípio de [[honestidade-radical]], o sistema eleva o custo de trapacear, não o elimina.

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[key-vault]] | 2 | criado |
| [[ucan]] | 2 | criado |
| [[chave-de-epoca]] | 1 | criado |
| [[rotacao-de-epocas]] | 1 | criado |
| [[blocks-aresta]] | 3 | criado |
| [[bloqueio-social]] | 3 | placeholder |
| [[honestidade-radical]] | 12 | placeholder |
| [[local-first]] | 12 | placeholder |

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | `§2.2.1` | Fonte canônica — acrescentar wikilink `[[predicado-de-bloqueio]]` na seção |
| `rfc-v4.md` | `§2.8` | Substituir descrição inline do predicado por `[[predicado-de-bloqueio]]` |
