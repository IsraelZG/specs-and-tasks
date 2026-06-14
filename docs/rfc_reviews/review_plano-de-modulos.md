# Revisão: Plano de Módulos — Marcos por Produto (`plano-de-modulos.md`)

## 1. Validação da Ideia Central
A separação do Plano em "Marcos de Entrega Demonstrável" (M0 ao M12) foca no valor progressivo. A estratégia de usar Mensageria (M1) como "Prover o Substrato" é clássica e validada no mercado (WhatsApp/Telegram rodando em SQLite local-first). Em seguida o foco brutal no "Núcleo IZG" (M2 a M4) garante o ROI e a viabilidade comercial do produto sem ter que esperar pelos "nice-to-haves" do M12 (Suite Office).

## 2. Refinamentos e Adições Sugeridas
- **Desmistificação do Marco 2 (Marketplace + Fintech):** O Marco 2 (M2) é colossal. Desenvolver um sistema de Transação Multi-Moeda, Split, Fintech com Conectores BaaS e Contratos (Sagas) simultaneamente pode exaurir a equipe no "Tunnel of Death" (meses sem entregar nada visível). É vital que o M2 seja iterativo: liberar a venda P2P nativa sem Split antes de injetar os oráculos externos da Fintech. A própria divisão (2a, 2b, 2c, 2d) indica isso, mas as dailys devem tratar cada sub-marco como uma "release" independente para stakeholders.
- **Testes de Estresse (Load Testing) antecipado:** O Marco 1 e Marco 7 dependem vitalmente da capacidade P2P e LiveKit para não engasgarem. O "DoD" e validação poderiam incluir explicitamente a prova de carga (Ex: Simular 100 usuários na mesma sala do LiveKit e 10k mensagens/segundo via WebRTC), para estressar a arquitetura base (M0) antes de seguir empilhando ERP (M3).

## 3. Conclusão Final do Ciclo
O documento serve como um belíssimo "Roadmap Executivo". Investidores e PMs olham para os M0-M12; Engenheiros olham para as tasks atômicas (`diff-preparativos-plano.md`); e Arquitetos olham para a `ordem-de-absorcao.md`. A taxonomia e o escopo da documentação V3.1 estão completos, revisados e formalmente fechados.
