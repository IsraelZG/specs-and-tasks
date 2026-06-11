# 06-connectors.md — Conectores de Notificação Out‑of‑Band

Especifica a camada de **egress out‑of‑band** (e‑mail, SMS, mensageria) usada para entregar a humanos alcançáveis: tokens de recuperação, links de convite, códigos 2FA. **Não** é transporte de grafo — é canal lateral.

---

## 1. Interface Única

```typescript
interface NotificationConnector {
  send(recipient: Recipient, template: TemplateRef, payload: Record): Promise;
  capabilities(): ConnectorCapabilities; // canais suportados, rate limits
}
```

Implementações:
- **SMTP (base):** menor denominador comum, self‑hostable, serve o Desktop‑servidor corporativo on‑prem. **Prioridade de desenvolvimento.**
- **Gmail API, WhatsApp Business API, SMS (Twilio):** adapters de entrega mais rica sobre a mesma interface.

A interface abstrai o backend: o resto do sistema chama `notify()` agnóstico de canal.

---

## 2. Propriedades Arquiteturais

- **Capacidade do papel de peer do sistema**, não do core. Amarra no tier (RFC §4.1.1): "recuperação por e‑mail" é dependência declarada do papel. **P2P puro sem conector não faz recuperação por e‑mail** (limite honesto, modality‑gated).
- **Spec‑driven (IoC):** a `SPECIFICATION` declara `connector` + `template`; o peer do sistema resolve e despacha. A UI não sabe qual backend.
- **Config sensível fora do grafo:** creds SMTP / API keys são infra do operador, **nunca** no grafo.
- **Conteúdo bearer:** o que é enviado (link de convite, token de recovery, código 2FA) é segredo portador — **TTL curto, single‑use**.

---

## 3. Casos de Uso

| Caso | Conteúdo | Origem |
| :--- | :--- | :--- |
| Recuperação de conta (corporativo) | token de reset | Central Custody (caderno‑2/02 §4.1) |
| Distribuição de convite | link `ASSET:INVITE` + multiaddr | RFC §2.4.4 |
| 2FA | código de fator | fluxo de desbloqueio (caderno‑2/02 §4.1) |

---

## 4. Limites Honestos

- Conector é infra operada por alguém: introduz uma dependência de disponibilidade e um ponto de confiança (o operador do SMTP vê os destinatários e o conteúdo dos e-mails de sistema).
- Entrega não é garantida (spam filters, indisponibilidade do provedor) — fluxos de recuperação devem ter canal alternativo (ex.: shard externo do SSS, caderno-2/02 §4.2).

---

## 5. Push Connector Content-Blind (conector de ingresso)

O **Push Connector** acorda dispositivos suspensos sem violar criptografia E2E (coexistindo com o `NotificationConnector` de egresso).

### 5.1 Fluxo de Funcionamento

1. Em background, o cliente registra o seu token Web Push (VAPID; FCM/APNs nos wrappers nativos) no peer do sistema, associado ao seu `DevicePeerId`, **fora do grafo**.
2. Ao replicar um registro destinado a um escopo do dispositivo, o peer do sistema dispara o push.
3. **Payload estritamente restrito:** `blind_scope_id`, [[hlc]] do novo head, e nonce anti-replay — **nunca** o conteúdo ou o `PersonaPeerId` do remetente.
4. O Service Worker acorda, executa reconciliação restrita ([[onda]] 1 da janela), decifra via [[key-vault]] local, e apenas então compõe a notificação nativa final para o usuário.
5. Sem chave em cache, o push é exibido em modo **mudo** ("Nova atividade") e adia a exibição do conteúdo.

*Ver mais em [[push-cego]] para os limites honestos e vazamento de metadados associados.*


