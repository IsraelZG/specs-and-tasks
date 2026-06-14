# Revisão RFC-009: Jurisdição e Regionalização de Regras

## 1. Validação da Ideia Central
A ampliação conceitual para "Múltiplas Jurisdições por Papel" (Ex: imposto de saída do Vendedor e de destino do Comprador operando simultaneamente) solidificou a proposta. Tirar o conector externo (A.4) do campo "regra" e tratá-lo meramente como Oráculo da Regra via RFC-007 resolve o perigo da plataforma assumir passivos regulatórios desnecessários. Tudo continua elegante: Jurisdição é apenas um Locale de Regras resolvido em cascata com `EXTENDS`.

## 2. Refinamentos e Adições Sugeridas
- **Resolução de Papéis em Cadeia Oculta (A.5):** Na venda "BR -> US" descrita, o imposto entra e sai. Mas no caso de um Marketplace multi-vendor, existe o *Merchant of Record* (MoR), onde a plataforma atua intermediando a transação fisicamente ou não. A RFC deve prever que as "Âncoras" (Titular, Origem, Destino) possam ser estendidas por `RoleAnchor` customizado para abarcar o modelo MoR.
- **Fallback Degradado Legal (A.4/A.5):** O limite honesto do A.4.3 e A.5.3 diz que na ausência de conector para uma das pontas, a operação degrada para "fato-negativo-verificável". Contudo, em ERPs fiscais, certos fatos geradores são legalmente bloqueantes: Você não pode transportar mercadorias degradadamente no Brasil sem a NF-e impressa. O modelo de degradação da plataforma precisa acionar um "Hard Stop Workflow" (Predicado de Bloqueio rígido) que impede o *Status de Expedição*, e não apenas seguir em frente silenciando a obrigação não cumprida.

## 3. Design System & UI Layout
### Ideias de Layout
- Indicador de Multi-Soberania: Toda transação financeira inter-estadual ou internacional ganha ícones minúsculos das bandeiras e siglas tributárias no seu Card (ex: "BRL + USD", "ICMS + VAT").
- Máquina do Tempo de Auditoria: Na view da Nota/Folha, um seletor visual permitindo "Recalcular sob regras da competência de 2024" x "Regras Atuais" (A.3), exibindo o *diff* no painel.

### Componentes Necessários
- **Atoms:** `JurisdictionBadge` (Com ícone da bandeira ou logo do estado).
- **Molecules:** `TaxCompositionRow` (Mostra qual regra gerou aquele valor).
- **Organisms:** `PolicyFallbackBanner` (Alerta chamativo vermelho informando que "O Conector de NF-e falhou, operação entrou em Contingência/Degradação").

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** Variants Jurisdicionais (`SPEC:FOLHA@BR`).
- **Arestas:** `EXTENDS` desde a SPEC base, e `SUPERSEDED_BY` em caso de revogação/mudança de lei.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Criado pela matriz para dar suporte a um novo país ou estado (ex: Governo cria um novo imposto).
- **Mutação:** Mutam por supersessão (novas versões baseadas na data de competência da lei).
- **Fim de Vida:** Impostos/leis revogadas perdem vigência, caindo em desuso, mas seus nós persistem na cadeia para garantir o recálculo de operações retroativas que foram faturadas durante a época da validade da norma.
