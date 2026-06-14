# Revisão RFC-010: Protocolo de Plugins e Computação Distribuída

## 1. Validação da Ideia Central
A consolidação de "Três Categorias de Capacidades" (`compute`, `connector`, `infra`) fecha as portas da dúvida arquitetural. Declarar explicitamente que componentes de infra pesada (SFU LiveKit, WebTorrent trackers) abrem **Canais de Rede Próprios** separados da porta Automerge alivia uma pressão tremenda que havia na especificação de rede. O casamento de Site (browser, node, peer, external) aliado à Política de Privacidade (A.6) resulta na arquitetura de Edge Computing mais completa e auditável já descrita no ecossistema.

## 2. Refinamentos e Adições Sugeridas
- **Resiliência e Fallback Transparente de SFUs (A.3):** Se a chamada LiveKit perde o SFU Host por queda do nó Operador (Node Plugin infra), a fallback imediata para P2P embutido nas regras (limite de participantes) pode falhar na sinalização (Signaling) em tempo real. É necessário garantir que as `room sessions` sejam persistidas de forma efêmera no grafo para reconexão rápida.
- **Portas de Fila Assíncrona e Locks Efêmeros (A.5):** O uso de `ASSET:LOCK` para que workers não sobreponham o mesmo Job (Tasks) é genial (Anti-Oversell aproveitado). Porém, locks de workers assíncronos precisam de Keep-Alives agressivos (Heartbeats) para que se a aba do "Browser Worker" de um transcode fechar acidentalmente, a task vá para a fila rapidamente e não trave por horas segurando o lock.

## 3. Design System & UI Layout
### Ideias de Layout
- Dashboard de Ativos Computacionais: Para ambientes corporativos, um "Gerenciador de Tarefas" visual que mostra o que a rede distribuída (Browser nodes vs Server nodes) está executando.
- App Store Segregada: Uma visão "Marketplace de Plugins" muito robusta exibindo selos "Nativo do Browser" vs "Exige Infra em Nuvem".

### Componentes Necessários
- **Atoms:** `PrivacyClassIndicator` (Dizendo se o plugin acessa PlainText ou não).
- **Molecules:** `PluginRequirementChecklist` (Requisitos: GPU Ativada? Worker Habilitado? Node.js 20+?).
- **Organisms:** `AsyncJobQueueManager` (Tabela que mostra o progresso das renditions de vídeo ou inferência de embeddings).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `SPECIFICATION:PLUGIN` (O manifesto assinado).
  - Nós Transitórios de Fila (Tasks aguardando/alocadas via `ASSET:LOCK`).
- **Arestas:** 
  - Arestas de Execução ligando o resultado de uma Task ao Worker que o assinou (`PERFORMED_BY`).

## 5. Ciclo de Vida dos Dados
- **Nascimento:** O autor cria o manifesto, o mercado P2P ou Central valida (Gate de Oferta).
- **Mutação:** Updates da lib criam linhagem (version tracking) e supersessões garantem rollback fácil se um patch explodir a app.
- **Fim de Vida:** Expurgados de caches locais, mas o `SPEC:PLUGIN` fica imutavelmente referenciado nas tarefas em que atuou, garantindo auditoria ("Essa planilha foi gerada pela IA XYZ-v2 no ano retrasado").
