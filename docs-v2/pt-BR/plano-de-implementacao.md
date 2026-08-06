---
id: plano-de-implementacao-v2
tipo: plano
status: ativo
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 14, item 10)
  - docs/plano-de-implementacao.md (estrutura herdada)
  - docs-v2/adr/ADR-001-autoridade-logica.md
substitui:
  - docs/plano-de-implementacao.md
---

# Plano de implementação v2

Este plano revisa o ciclo de implementação para a nova topologia. Os
princípios herdados permanecem: spec-first, portas antes de adapters,
isomorfismo no core, decisão em `SPECIFICATION`, honestidade radical nos
testes.

## 1. O que muda em relação ao plano anterior

| Antes | Agora |
| :--- | :--- |
| RBSR como caminho normal de sync | change feed autoritativo com manifestos |
| Gênese pelo primeiro peer (FPP/GENESIS) | criação da rede pela autoridade |
| Três modalidades de rede | duas topologias com autoridade + perfis regulatórios |
| Custódia por consistent hashing e gossip | custódia designada pela autoridade |
| Peer do sistema | autoridade lógica (uma ou mais instâncias) |
| Escrita direta no grafo pelo cliente | proposta via outbox, confirmação pela autoridade |

## 2. Marcos revisados

```
M0 Fundação e testabilidade
 └─► M1 Cripto, identidade e storage local
      └─► M2 Autoridade lógica, transporte WS e handshake
           ├─► M3 Change feed, manifestos e ondas
           │     └─► M6 Linhagem, forks e correções compensatórias
           ├─► M4 P2P oportunístico (sinalização, promoção, relay)
           │     └─► M7 Private Swarm
           └─► M5 Identidade legal, UCAN, épocas e conectores
                       └─► M8 Blobs e plano de mídia
M9 Perfil corporate-regulated/securitization
M10 Endurecimento, suíte adversarial e observabilidade
```

## 3. Marcos novos ou reescritos

### M2 — Autoridade lógica

- Serviço de autoridade: criação de rede, admissão de membros, diretório de
  peers, sinalização, distribuição de chaves.
- Emissão e validação de manifestos de lote com encadeamento.
- Réplicas da autoridade com estado consistente. Uma instância física não é
  ponto único de falha lógico.
- Aceite: cenário com duas instâncias da autoridade e um cliente. A
  indisponibilidade de uma instância não interrompe o feed.

### M3 — Change feed

- Cursor monotônico por partição. Lotes com manifesto assinado.
- Fluxo de leitura com escolha de fonte e validação por hash.
- Outbox durável e fluxo de escrita por proposta.
- Eventos compensatórios. Nenhuma alteração de registro confirmado.
- Aceite: os testes de conformidade de
  `docs-v2/protocolo/graph-sync-protocol.md` seção 12.

### M4 — P2P oportunístico

- Sinalização e autorização de conexões diretas pela autoridade.
- Entrega de registros por peers com validação pelo manifesto.
- Fallback por WebSocket ou relay da autoridade.
- Aceite: um lote entregue por peer hostil com um byte alterado é
  rejeitado pelo cliente.

### M9 — Perfil `corporate-regulated/securitization`

1. Ficha de enquadramento versionada e bloqueante.
2. Dossiê da emissão, livros formais e fechamentos encadeados.
3. Contas de titulares, ordens, movimentos e estornos compensatórios.
4. Gravames com bloqueio de movimentos incompatíveis.
5. Patrimônio separado com isolamento lógico e contábil.
6. Registro externo com reconciliação e bloqueio.
7. KYC, PLD/FTP e matriz de habilitação fiscal.
8. Retenção por classe documental, legal hold e atendimento LGPD.
9. Conectores regulatórios com evidência por chamada.
- Aceite: os critérios de aceite jurídico-técnicos do briefing, seção 16.

## 4. Estratégia de testes

Os três anéis permanecem: simulação determinística, integração
multi-processo e E2E real. As asserções de convergência mudam de
fingerprint de range para cursor e hash de manifesto. Os vetores
adversariais ganham casos novos:

1. Manifesto com `prev_manifest_hash` forjado.
2. Peer servindo registro fora do manifesto.
3. Autoridade ausente durante proposta de escrita.
4. Movimento de titularidade sem ordem aprovada.
5. Descarte sob legal hold.
6. Movimento entre patrimônios separados incompatíveis.

## 5. Fora de escopo deste ciclo

- Oferta pública. O perfil cobre colocação privada.
- RBSR no caminho do cliente. Permanece como auditoria entre réplicas da
  autoridade.
