---
id: T-ESIGN-01
title: "SPIKE: discovery jurídico e de integração DocuSeal"
status: draft:triaged
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: []
blocks: []
capacity_target: opus-spike
---

# T-ESIGN-01 · SPIKE: discovery jurídico e de integração DocuSeal

## 0. Ambiente de Execução Obrigatório
- **Natureza:** discovery jurídico, produto e arquitetura; não é parecer jurídico definitivo nem implementação.
- **Código observado:** documentação e API oficiais de `docusealco/docuseal`; não usar `IsraelZG/docuseal` como fonte de versão/pin.
- **Capacidade-alvo:** `opus-spike`; entregável = matriz revisável por jurídico + desenho de integração. Não instala, hospeda ou conecta uma instância real.
- **Dados:** exclusivamente PDF e identidades fictícias; é proibido processar contratos, CPFs, e-mails ou evidências reais.

## 1. Objetivo
Definir se, para quais documentos e sob quais controles, DocuSeal pode ser adotado como serviço de assinatura eletrônica no SuperApp Brasil. Separar validade contratual, força probatória, formalidades legais, LGPD e custo/licença; propor a fronteira como conector + plugin UI opaco, nunca componente nativo do Design System.

## 2. Contexto RAG
- `docs/caderno-3-sdk/27-suite-office.md` §3 — PDF/e-signature como capacidade de suíte, não motor de assinatura reimplementado.
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` §6 — capability manifest, sandbox e conector externo.
- `docs/caderno-3-sdk/10-design-system.md` e `docs/adr/0016-ui-engines-e-flow-grid.md` — fronteira shell/Design System, plugin UI e engine reutilizável.
- [DocuSeal upstream](https://github.com/docusealco/docuseal) e [licença/termos](https://github.com/docusealco/docuseal/blob/master/LICENSE) — AGPLv3 e atribuição obrigatória na UI interativa.
- [API](https://www.docuseal.com/docs/api), [embedded React form](https://www.docuseal.com/docs/embedded/form/react) e [pacote React](https://github.com/docusealco/docuseal-react) — integração e dependências de produto/servidor.
- [Lei 14.063/2020](https://www.presidencia.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14063.htm) e [STJ sobre plataforma não ICP-Brasil](https://www.stj.jus.br/sites/portalp/paginas/comunicacao/noticias/2026/18032026-terceira-turma-valida-emprestimo-digital-com-assinatura-em-plataforma-nao-certificada-pela-icp-brasil.aspx) — fontes iniciais; conclusão depende de jurídico brasileiro habilitado.

## 3. Perguntas e Evidências Obrigatórias
1. Matriz de documentos previstos (contrato privado, NDA, proposta, RH, procuração, crédito/fintech, regulados e poder público) × assinatura simples/avançada/qualificada × risco × formalidade × decisão `elegível | condicional | não elegível`.
2. Para cada caso elegível: identificação, consentimento, vínculo ao signatário, integridade, audit log, retenção, exportação, contestação e cadeia de custódia. IP/hash isoladamente não qualificam assinatura avançada.
3. Limitações core, recursos Pro, provedores terceiros, custo, hospedagem, backup, RTO/RPO, portabilidade e saída.
4. Avaliação LGPD/DPIA preliminar: controlador/operador, dados, base legal, minimização, retenção/eliminação, residência, acessos administrativos e incidentes.
5. Avaliar AGPL, atribuição, pacote React MIT e impactos de self-hosted/embedded antes de distribuição.
6. Desenhar: `workflow → connector/adaptor → API/webhook DocuSeal`; UI em plugin/iframe sandboxed ou fluxo externo. Exigir autenticação/verificação de webhook, idempotência, replay seguro e correlação de submissão.
7. Obter validação do jurídico brasileiro, especialmente para crédito, procurações, consumo, trabalho, documentos públicos e exigências ICP-Brasil/qualificada.

## 4. Critérios de Decisão
- `GO discovery`: jurídico valida ao menos um grupo documental e controles técnicos/probatórios são implementáveis.
- `NO-GO`: licença, retenção, identidade, formalidade ou custo inviabilizam o alvo; registrar alternativa e gatilho.
- Decisão é granular por classe documental. É proibido concluir “total validade jurídica” para toda a plataforma.
- Task de integração só nasce após decisão de hospedagem, plano/licença, documentos, nível de assinatura e owner da evidência.

## 5. Não Fazer / Pegadinhas
- **NÃO** integrar, publicar, self-host, enviar PDF real ou chamar produção.
- **NÃO** tratar documentação do fornecedor como parecer jurídico brasileiro.
- **NÃO** renderizar DocuSeal em `@plataforma/ui-engines` nem tentar reestilizar sua UI como Design System.
- **NÃO** prometer ausência de custo: embedded e provedores podem ser comerciais.
- **NÃO** persistir token, webhook secret, audit log ou documento de teste no repositório.

## 6. Feedback de Especificação
Fecha decisões de produto/jurídico antes de tasks de conector, UI plugin ou workflow. Classe documental sem resposta jurídica fica fora de escopo; o shell ao redor é governado pelo Design System, nunca a UI opaca do terceiro.

## 7. Definition of Done
- [ ] Matriz Brasil por documento, assinatura, formalidade, risco e validação/restrição jurídica explícita.
- [ ] Avaliação LGPD, evidência/auditabilidade, retenção e contestação.
- [ ] Avaliação AGPL/atribuição, plano comercial e custo operacional.
- [ ] Desenho de conector, webhooks e UI plugin/iframe com fronteiras de segurança.
- [ ] Veredito `NO-GO | piloto limitado | criar tasks de integração`, com pré-condições e owner dos riscos.

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-16T14:21]** - *gpt-5* - `[Triado]`: Discovery jurídico, produto e fronteira de integração DocuSeal triada.
