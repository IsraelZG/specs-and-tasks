# Resolução de Consistência das RFCs

Este plano visa corrigir as lacunas, inconsistências e colisões apontadas no Relatório de Consistência, conforme as diretrizes recebidas.

## 1. Alterações Diretas (Serão delegadas a um Subagente)

As seguintes alterações serão processadas automaticamente por um subagente de código após a aprovação deste plano:

### A. Renumeração Consistente do Caderno 3 (O-01 e O-02)
O arquivo `09-hierarchical-theme-customization.md` será mantido em seu slot. Todas as RFCs que criam novos arquivos no `caderno-3` serão atualizadas para seguir o novo mapa, deslocando o início para `10` e resolvendo o choque do slot 22:
- RFC-006: `10-design-system.md`
- RFC-008: `11-linguagem-de-paginas.md`
- RFC-010: `12-plugins-e-computacao.md`
- RFC-011: `13-ia-rag-e-agentes.md`
- RFC-012: `14-marketplace-reference-spec.md`
- RFC-013: `15-erp-crm-reference-spec.md`
- RFC-014: `16-contabil-fiscal-rh-reference-spec.md`
- RFC-015: `17-anuncios-reference-spec.md`
- RFC-016: `18-social-reference-spec.md`
- RFC-017: `19-streaming-reference-spec.md`
- RFC-018: `20-mensagens-reference-spec.md`
- RFC-019: `21-email-reference-spec.md`
- RFC-020: `22-calendario-reference-spec.md`
- RFC-021: `23-mapa-reference-spec.md`
- RFC-022: `24-workflow-reference-spec.md`
- RFC-023: `25-logistica-reference-spec.md`
- RFC-025: `26-suite-office.md`
- RFC-026: `27-shell-e-composicao.md`

### B. Correções de Referência Cruzada e Escopo Simples
- **O-03 (RFC-009):** Corrigir cabeçalho para "rfc-012 (Marketplace+Fintech) e rfc-013 (ERP/CRM)".
- **O-04 (RFC-010):** Corrigir §A.6.3 para "rfc-014 (folha)".
- **O-05 (RFC-012):** Corrigir §A.9.2 para "Anúncios (rfc-015)".
- **O-06 (Ordem/Plano):** Inserir notas em `ordem-de-absorcao.md` e `plano-de-modulos.md` frisando que "ordem de absorção de cadernos não é a mesma ordem dos marcos de build".
- **L-04 (RFC-013 e RFC-014):** Adicionar parágrafo normativo vinculando os dados pessoais sensíveis (Leads, RH) às primitivas da LGPD já canônicas no `caderno-1/03` (asset-consent, expurgo por época, retenção prevalecente).
- **L-05 (RFC-022):** Declarar explicitamente que instâncias de workflow *in-flight* terminam a execução usando a versão da `SPEC:WORKFLOW` na qual nasceram (pin de versão por instância).
- **L-06 (RFC-022):** Adicionar diretriz para que *tarefas humanas* (`APPROVED_BY`) contenham `timeout` e `política de escalonamento` declarados na SPEC.

---

> [!WARNING]
> ## User Review Required
> Abaixo explico detalhadamente os três problemas de negócio/arquitetura complexos (L-01, L-02 e L-03), bem como as alternativas e trade-offs. **Por favor, revise as opções e indique sua decisão para cada um deles para que possamos prosseguir com a implementação.**

## L-01: Ressurreição de deadline em P2P (RFC-022)

**O Problema:** Em um workflow orquestrado de forma P2P (onde o peer que iniciou o workflow atua como o motor de transição), timers e prazos HLC (`Deadlines`) ficam apenas na memória RAM ou SQLite local daquele peer ativo. Se esse peer (orquestrador) ficar offline, os "timeouts" (ex: "Se o pagamento não cair em 24h, cancele") não irão disparar, deixando a saga zumbi e os Locks presos além do necessário.

**Alternativas:**
1. **Delegar ao Operador Híbrido (System Peer):**
   - *Como funciona:* Ao iniciar um timer de workflow longo, o Peer P2P emite um "Fato de Agendamento" para o System Peer da rede. O System Peer age como o CRON global da rede e envia a transação de "Timeout" quando a hora chegar.
   - *Trade-off:* Quebra o "P2P Puro" para sagas com timers, exigindo o "Operador/Servidor" no meio. Mas garante confiabilidade absoluta.
2. **Cron Gossip (Vigias de Linhagem):**
   - *Como funciona:* Qualquer peer que assine a linhagem daquele workflow (ex: Vendedor e Comprador) salva o prazo em suas filas locais. Quem ficar online e bater o relógio (HLC) primeiro dispara o Intent de "Timeout". Se os dois estiverem offline, quando qualquer um voltar o timeout dispara retroativamente.
   - *Trade-off:* Mantém a pureza P2P. Contudo, se nenhum envolvido da linhagem ligar o computador na janela, o prazo só será resolvido com grande atraso, o que impacta o SLA da operação.

## L-02: k-anonimato na segmentação (RFC-015)

**O Problema:** Mesmo que a consulta do Anúncio (segmentação via GraphRAG) rode no próprio device do usuário para garantir privacidade criptográfica local, um anunciante malicioso poderia criar uma regra de segmentação tão exata (ex: "CEP 123, Idade 42, Fez compra XYZ ontem") que, ao saber que seu único anúncio foi entregue e clicado, ele acabou des-anonimizando quem é o dono daquele IP/Aparelho.

**Alternativas:**
1. **Coorte Mínimo Hardcoded (k-Anonymity):**
   - *Como funciona:* A infraestrutura de anúncios exige que a métrica/segmentação atinja pelo menos `N = 100` usuários na rede para que a campanha seja habilitada a iniciar o pacing e entrega.
   - *Trade-off:* Protege os usuários. Contudo, impede anunciantes locais ou nichos muito pequenos (ex: "Padaria que só quer atingir o prédio vizinho") de usar a plataforma.
2. **Obfuscação Diferencial de Clique:**
   - *Como funciona:* Não proíbe campanhas de nicho, mas o device envia o relatório de clique "com ruído" (Differential Privacy) ou os agrupa num relay (Oblivious HTTP) junto com cliques fakes que depois são descartados financeiramente, impedindo o anunciante de rastrear IP -> Indivíduo.
   - *Trade-off:* Mais complexo de implementar, mas permite o hiper-target local de lojistas, protegendo a privacidade através de fumaça técnica em vez de restrição estatística de coorte.

## L-03: MoR + hard-stop legal (RFC-009)

**O Problema Parte A (Merchant of Record):** Em marketplaces multi-vendor (vendedor + comprador + intermediário cobrando), a RFC fala de Âncoras como Origem, Destino, Prestação e Titular. O papel do Intermediário legal (o MoR, que recolhe imposto centralizado ou assina obrigações perante a bandeira de cartão) está ausente na definição.
**O Problema Parte B (Hard Stop Legal):** O protocolo tende a degradar quando há falha (seguir o fluxo marcando a pendência - fato negativo). Porém, no Brasil, expedir mercadoria sem Nota Fiscal Eletrônica é infração penal/fiscal grave (apreensão do caminhão). A plataforma não pode "degradar" silenciosamente a emissão e seguir a saga.

**Alternativas:**
1. **Âncora `MoR` Nativa + Workflow de Bloqueio Rígido:**
   - *Como funciona:* Cria-se explicitamente o papel `Merchant of Record` nas variantes jurisdicionais. O workflow do ERP (RFC-013) ganha "Predicados de Bloqueio": uma regra jurisdicional pode declarar um fato como `blocking: true`. Sem o fato da NF-e, o Estado do Workflow falha na transição "Faturado -> Expedido" impedindo o UI e a Orquestração de avançar.
   - *Trade-off:* É a única forma correta para ERPs fiscais, mas adiciona um vetor de rigidez (se o conector da Sefaz cair, toda a expedição da empresa para, o que é o comportamento correto do mundo real, mas gera atrito técnico de suporte).
2. **Responsabilidade Deslocada ao Cliente:**
   - *Como funciona:* A plataforma mantém o fluxo degradado, mas embute um aviso em Vermelho Escuro na UI: "Expedição sem documento legal. Risco do Lojista". O MoR é modelado apenas como um Vendedor secundário na Saga de Split, sem regra explícita no núcleo.
   - *Trade-off:* A plataforma tira o corpo fora, o que é mais fácil tecnicamente, mas torna o sistema "inseguro por padrão" para uso empresarial Enterprise.

**Aguardo suas decisões sobre (L-01, L-02 e L-03) para que eu possa incorporar as respostas finais aos documentos junto das tarefas automáticas.**
