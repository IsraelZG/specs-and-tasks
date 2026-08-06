---
id: topologia-e-autoridade
tipo: arquitetura
status: ativo
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seções 5 e 6)
  - docs-v2/adr/ADR-001-autoridade-logica.md
substitui:
  - docs/conceitos/modalidade-de-rede.md
  - docs/conceitos/pragmatismo-topologico.md
  - docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md (seção 1.5)
conceitos:
  - autoridade-logica
  - p2p-oportunistico
  - perfil-regulatorio
---

# Topologia de rede e autoridade lógica

## 1. Definições

### 1.1 Autoridade lógica

A autoridade lógica é a função de governo de uma rede. Uma entidade jurídica
identificada responde por ela. A autoridade lógica é única por rede.

A autoridade pode executar em várias instâncias físicas. As instâncias formam
um único sistema lógico com estado compartilhado ou replicado de forma
consistente. Alta disponibilidade não cria autoridades concorrentes.

A autoridade não exige provedor de nuvem. Ela pode operar em infraestrutura
própria, local ou contratada.

### 1.2 Topologias admitidas

| Topologia | Operador | Uso típico |
| :--- | :--- | :--- |
| `corporate` | A própria organização ou prestador sob governança dela | Intranet, operação privada |
| `public-operated` | Fundador ou operador identificado da rede pública | Rede aberta a participantes convidados |

Ambas as topologias exigem um responsável jurídico e um responsável técnico
identificados no registro de criação da rede.

### 1.3 Perfil regulatório

O perfil regulatório é um conjunto de controles obrigatórios aplicado sobre
uma topologia. Topologia e perfil são decisões independentes.

Exemplo: o perfil `corporate-regulated/securitization` endurece uma rede
corporativa para emissão de debêntures privadas. Um administrador comum não
pode desativar os controles obrigatórios do perfil.

## 2. Funções exclusivas da autoridade

A autoridade controla estas funções. Nenhum cliente as executa.

1. Criação da rede.
2. Admissão e remoção de membros.
3. Emissão e revogação de capacidades.
4. Diretório de peers e sinalização.
5. Distribuição e rotação de chaves.
6. Validação de operações de domínio.
7. Ordem e completude do grafo oficial.
8. Retenção integral e recuperação.
9. Políticas regulatórias da rede.

## 3. P2P oportunístico

Clientes autorizados podem formar conexões diretas entre si. A autoridade
fornece a sinalização e a autorização para cada conexão.

Quando o canal direto falha, o cliente usa WebSocket ou relay operado pela
autoridade.

### 3.1 Dados que peers podem trocar

- Mudanças de documentos Automerge.
- Presença e mensagens efêmeras.
- Registros do grafo já confirmados pela autoridade.
- Lotes confirmados por manifesto da autoridade.
- Blobs cifrados e verificáveis por hash.
- Caches privados entre dispositivos do mesmo titular.

### 3.2 Ações que peers não podem executar

- Criar uma rede independente.
- Admitir membros sem a autoridade.
- Criar uma época de chaves oficial.
- Declarar a completude do grafo.
- Confirmar uma operação não comutativa.
- Alterar uma política regulatória.
- Substituir a cópia autoritativa.

### 3.3 Modelo de confiança

Uma conexão P2P melhora latência e custo. Ela não altera o modelo de
confiança. Um peer entrega bytes. Somente o manifesto da autoridade prova
completude e posição no feed. O cliente valida hash e assinatura de cada
registro, qualquer que seja a fonte dos bytes.

## 4. Descoberta e primeiro contato

A DHT pública não é usada para descobrir o grafo privado. Os canais de
descoberta são:

1. Diretório de peers da autoridade.
2. mDNS em rede local.
3. Link multiaddr assinado, distribuído fora de banda.
4. Convite `ASSET:INVITE` emitido sob as regras da rede.

Trackers privados, WebSeeds e peers autorizados localizam blobs. Ver
`docs-v2/sdk/media-transport-plane.md`.

## 5. Reputação

Scores de reputação permanecem locais e não transitivos. Eles servem para
detectar abuso e medir qualidade de serviço. Eles não decidem a validade do
ledger nem elegem validadores.

## 6. Invariantes de conformidade

- Nenhuma rede ativa funciona sem autoridade lógica.
- Nenhuma autoridade depende de uma única instância física.
- Clientes não elegem uma nova autoridade.
- A rotação da autoridade é um ato de governança registrado no grafo oficial.
- WebSocket ou relay da autoridade fornece o caminho de fallback sempre
  disponível.
