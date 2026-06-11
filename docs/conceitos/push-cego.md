---
name: push-cego
title: "Push Notifications Content-Blind (Push Cego)"
aliases: ["push cego", "push-cego", "Push Connector", "blind_scope_id"]
tags: [protocol, sdk, notificacoes, seguranca]
---

# Push Notifications Content-Blind (Push Cego)

## Definição

O Push Cego é o mecanismo de acordar dispositivos móveis ou suspensos por meio de notificações push que não carregam nenhum tipo de conteúdo descriptografado, nem mesmo metadados explícitos sobre o remetente, preservando a criptografia de ponta a ponta (E2E) na camada de transporte lateral.

## Por quê

Dispositivos suspensos precisam ser acordados para sincronizar dados em background, mas as infraestruturas de push comerciais (Apple APNs, Google FCM) operam fora da criptografia do sistema. Enviar o conteúdo ou metadados de identidade por esses canais comprometeria a segurança.

## Contrato

O contrato técnico de [[caderno-3-sdk/06-connectors#5-push-connector-content-blind-conector-de-ingresso]] define o fluxo de funcionamento:

1. **Registro:** O cliente registra seu token Web Push associado ao seu `DevicePeerId` no peer do sistema, **fora do grafo**.
2. **Disparo:** Ao replicar um registro destinado a um escopo do dispositivo, o peer do sistema dispara o push.
3. **Payload restrito:** O payload é estritamente constituído por: `blind_scope_id`, [[hlc]] do novo head, e nonce anti-replay. **Nunca** contém o conteúdo ou a identidade do remetente (`PersonaPeerId`).
4. **Despertar:** O Service Worker do dispositivo acorda, realiza reconciliação restrita no background ([[onda]] 1), decifra localmente usando as chaves do [[key-vault]] e monta a notificação nativa para o usuário.
5. **Fallbacks:** Sem a chave necessária em cache, o push é exibido de forma **muda** ("Nova atividade") adiando o conteúdo até a reidratação.

### Limites Honestos (Metadados e Abusos)

- **Vazamento de metadados:** Embora o operador do conector/relays de push não aprenda o conteúdo das mensagens, ele observa o **padrão temporal** de tráfego (quando os dispositivos acordam, quais e qual `blind_scope_id` recorrente é referenciado), permitindo mapeamento de grafo social parcial em redes públicas.
- **Defesa anti-lixo (Spam):** Como o custodiante de push não valida a semântica do grafo antes de disparar o push, as defesas contra abusos/lixo são econômicas (cotas por `DevicePeerId` emissor e standing) e não criptográficas.

## Implementação

Implementado via **Push Connector** no Sync Worker local em conjunto com os Service Workers nos navegadores e nativos.

## Evolução

Políticas de mitigação (como padding de tráfego, batching de pushes ou rotação do `blind_scope_id` por época) podem ser configuradas no nível da `SPECIFICATION`.

## Aparições a consolidar

Nenhuma.


