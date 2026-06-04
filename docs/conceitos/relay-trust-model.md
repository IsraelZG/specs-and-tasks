---
title: Relay Trust Model
slug: relay-trust-model
aliases: ["RelayTrustModel", "relay-trust-model", "Modelo de Confiança de Relays"]
tags: [protocol, p2p, transporte, network]
modo: canonical
---

# Relay Trust Model

**Modo canonical** — fonte normativa: `rfc-transporte-p2p-v3.1.md §2.5.2`. Glossário (`glossary.md §RelayTrustModel`) consolidado aqui.

> Aparições consolidadas:
> - `glossary.md §RelayTrustModel` — definição curta (canonical aqui).
> - `rfc-transporte-p2p-v3.1.md §2.5.2` — score local, shadowban de relays e mitigação de falso-positivo (fonte normativa principal).
> - `rfc-transporte-p2p-v3.1.md §2.2.1` — shadowban de 24h por falhas criptográficas no handshake Noise_XX.

---

## Definição

O **Relay Trust Model** (geralmente referido como `RelayTrustModel`) é o sistema de score local e não-transitivo mantido por cada peer para avaliar o desempenho e a confiabilidade dos relays WebRTC aos quais está conectado ou que foram descobertos no [[swarm-registry]]. Peers atuando como relays que apresentam comportamento suspeito ou desempenho insatisfatório (como alta latência, pacotes descartados ou falhas criptográficas) sofrem um banimento silencioso local (*shadowban*). O score e a classificação são restritos a cada peer e **não** são propagados para a rede, blindando os participantes contra ataques de difamação (*badmouthing*).

---

## Por quê ([[vision]])

A plataforma adota o princípio de [[pragmatismo-topologico]], assumindo a verdade desconfortável de que a travessia de NAT simétrico falha com frequência e exige relays para viabilidade operacional. Contudo, em uma rede [[local-first]] oportunística e potencialmente hostil, os relays são recursos compartilhados propensos a gargalos, falhas físicas ou comportamento malicioso. 

O `RelayTrustModel` permite a autogestão local desses recursos comuns por meio de score individualizado. Ele adota o princípio de **não-transitividade** para evitar que peers maliciosos propaguem falsas acusações (*badmouthing*) sobre relays honestos. Com isso, garante-se a resiliência topológica sem criar pontos centralizados de reputação de transporte.

Consulte o [caderno-1-vision/01-vision-and-positioning.md](file:///c:/Dev2026/Docs/docs/caderno-1-vision/01-vision-and-positioning.md#L18-L28) para detalhes sobre pragmatismo topológico.

---

## Contrato ([[protocol]])

O comportamento normativo e as regras do `RelayTrustModel` são regidos pelo protocolo descrito abaixo.

### Score Local e Shadowban Silencioso (RFC §2.5.2)

Cada peer mantém o histórico de interações com os relays ativos, calculando um score baseado em três métricas:
1. **Uptime:** Fração de tempo que o relay permanece disponível e respondendo a requisições de sinalização/circuito.
2. **Latência:** RTT (Round-Trip Time) medido no estabelecimento e durante o uso do circuito.
3. **Pacotes Descartados:** Proporção de mensagens ou requisições enviadas ao relay que não obtêm confirmação ou falham no encaminhamento.

Relays com desempenho que caia abaixo dos limites configurados na especificação da rede sofrem **shadowban silencioso local**:
* O `SwarmRegistry` remove o relay da lista de caminhos elegíveis para roteamento.
* O shadowban é silencioso (o relay penalizado não é notificado e outros peers não são avisados) para evitar a revelação de estratégias de defesa.

### Histerese e Prevenção de Falso-Positivo

Para diferenciar relays legítimos sob congestionamento temporário de relays maliciosos ou inoperantes, o modelo emprega uma **janela deslizante com histerese**:
* As métricas de telemetria são acumuladas em janelas temporais móveis.
* A penalização exige a extrapolação acumulada de falhas dentro da janela.
* A recuperação do status de confiança exige um período contínuo de desempenho exemplar, impedindo que o relay oscile rapidamente entre os estados de ativo e banido (*flapping*).

### Integração com Handshake Criptográfico (RFC §2.2.1)

Durante o handshake [[noise-xx]], qualquer falha criptográfica (como assinatura Ed25519 inválida ou chave incorreta fornecida pelo par) resulta em uma penalidade imediata no `RelayTrustModel` local:
* O peer que falhar no handshake recebe um **shadowban fixo de 24 horas**.
* Durante este período, nenhuma tentativa de conexão direta ou roteamento por circuito através desse peer será efetuada.

---

## Implementação ([[sdk]])

Na arquitetura do SDK, a lógica do `RelayTrustModel` reside e é computada diretamente no [[sync-worker]], utilizando metadados coletados e mantidos em RAM pelo [[swarm-registry]]:

* **Roteamento de Circuitos:** Quando a engine de conexões necessita rotear dados via relay (por impossibilidade de hole punching direto sob NAT simétrico), o `SyncWorker` consulta o `RelayTrustModel` para filtrar apenas relays com score positivo.
* **Evicção de Peers:** Peers detectados como inativos ou banidos pelo `RelayTrustModel` são suspensos do mapeamento ativo, prevenindo que falhas consecutivas de conexão travem a fila de dispatch de mensagens do worker.

Para mais detalhes da orquestração em nível de código, consulte o [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md) e a [rfc-transporte-p2p-v3.1.md §3.2.2](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L355-L371).

---

## Evolução ([[governance]])

Os limites aceitáveis de latência, as janelas deslizantes de cálculo de histerese e as políticas de expiração de shadowban (como as 24 horas padrão de falha criptográfica) são definidos como parâmetros declarativos nas especificações que governam a rede. 

Em implementações futuras da plataforma (como nas redes corporativas sob a v4), o `RelayTrustModel` poderá interagir com pools de stakers ou exigir depósitos de garantia (`[[bond-caucao]]`) dos operadores de Super Peers para mitigar ataques na camada física de transporte.

Consulte o [caderno-4-governance/03-specification-lifecycle-and-rfcs.md](file:///c:/Dev2026/Docs/docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md) para detalhes sobre a evolução das especificações da plataforma.

---

## Dependências por onda

A tabela abaixo lista os conceitos associados ao modelo de confiança de relays. Dependências de ondas futuras são marcadas e mantidas como Foam placeholders.

| slug | onda | status |
|:-----|:-----|:-------|
| [[peer-id]] | 2 | placeholder |
| [[noise-xx]] | 2 | criado |
| [[swarm-registry]] | 5 | criado |
| [[connection-promotion-engine]] | 5 | Foam placeholder (Onda 5) |
| [[sync-worker]] | 7 | Foam placeholder (Onda 7) |
| [[bond-caucao]] | 10 | Foam placeholder (Onda 10) |
| [[local-first]] | 12 | Foam placeholder (Onda 12) |
| [[modalidade-de-rede]] | 12 | Foam placeholder (Onda 12) |
| [[pragmatismo-topologico]] | 12 | Foam placeholder (Onda 12) |
| [[honestidade-radical]] | 12 | Foam placeholder (Onda 12) |

---

## Aparições a consolidar

A tabela abaixo rastreia os arquivos onde o conceito é redefinido ou detalhado normativamente.

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `docs/glossary.md` | `§RelayTrustModel` | Substituir por resumo e link `[[relay-trust-model]]` |
| `docs/rfc-transporte-p2p-v3.1.md` | `§2.5.2` | Manter texto normativo; inserir referência wikilink `[[relay-trust-model]]` |
| `docs/rfc-transporte-p2p-v3.1.md` | `§2.2.1` | Substituir menção genérica por referência wikilink `[[relay-trust-model]]` |
