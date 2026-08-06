---
id: adr-025-gramatica-de-perfil-regulatorio
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling 2026-08-03
  - docs-v2/pt-BR/perfil-securitizacao/perfil.md (§1, instância observada)
  - docs-v2/pt-BR/adr/ADR-009-perfil-regulatorio-como-overlay.md
resolve:
  - questoes-abertas.md Q-04
---

# ADR-025 — Quatro operadores de perfil, derivados da instância

## Método

A gramática não foi inventada. Ela foi lida da tabela de controles obrigatórios
do perfil `corporate-regulated/securitization`, olhando para as **transições**
em vez dos controles. Onze linhas usam exatamente quatro operadores.

## Os operadores

| Operador | Transição | Exemplo na instância |
| :--- | :--- | :--- |
| `elevar` | opcional → obrigatório | KYC e KYB, beneficiário final, PLD/FTP, vínculo chave ↔ identidade legal |
| `introduzir` | ausente → obrigatório | ficha de enquadramento, dossiê, contas individualizadas, livros formais |
| `travar` | configurável → não contornável | retenção por classe documental |
| `condicionar` | obrigatório se predicado | registro externo, patrimônio separado, ambos condicionais ao enquadramento |

## Invariante: perfil só endurece

Nenhuma linha da instância afrouxa. Não existe `obrigatório → opcional` em
lugar nenhum. **Um perfil regulatório só pode restringir ou acrescentar.**

Esta é a mesma monotonicidade do piso do ADR-017 e da restrição do ADR-018. É o
que tornaria dois perfis empilháveis com resultado bem definido — a união dos
endurecimentos — se a composição vier a ser especificada.

## Critérios de aceite são a suíte de conformidade do perfil

A instância declara os seus na §6. Um perfil, portanto, não é apenas um conjunto
de restrições: ele carrega como se verifica que foi satisfeito. Isso o encaixa no
ADR-003 sem mecanismo novo — a suíte de conformidade do overlay.

## O que NÃO está decidido

Uma instância não exercita estas três coisas, e derivá-las aqui seria inventar:

1. **Composição.** O que acontece quando uma rede aplica dois perfis
   regulatórios. A invariante de monotonicidade sugere que a união é
   bem-definida, mas sugerir não é especificar.
2. **Versionamento.** Como um perfil evolui e o que acontece com emissões já
   enquadradas sob a versão anterior.
3. **Aplicação a rede viva.** O que acontece com registros já existentes quando
   um perfil é aplicado a uma rede que já opera. Um perfil que introduz controle
   bloqueante encontra um passado que não o satisfaz.

Nenhuma das três é hipotética a longo prazo; todas ficam explicitamente em
aberto até haver evidência.

## Consequências

- Os 16 arquivos de `perfil-securitizacao/` ganham estatuto formal: são a
  primeira instância da gramática, não especificação de produto.
- Contratos passa a ter o que o ADR-009 lhe prometeu, sem ter esperado por um
  segundo domínio regulado.
- O terceiro ponto em aberto é o mais perigoso na prática: aplicar perfil a rede
  viva é o caso real de um cliente que decide se regular depois de já operar.
