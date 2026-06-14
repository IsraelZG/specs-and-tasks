# Revisão RFC-014: Contábil, Fiscal e RH

## 1. Validação da Ideia Central
A filosofia de "Lançamento Derivado por SPEC" mata os bugs clássicos de divergência entre Financeiro e Contábil. A delegação radical do peso regulatório para os Conectores e Variantes Jurisdicionais (RFC-009) é a única forma de viabilizar o projeto globalmente. A expansão com os 6 "Limites Honestos" (A.7) (prazo legal, lacunas de sync, propagação de erro de classificação, defasagem) é o selo de maturidade e imunidade regulatória da plataforma.

## 2. Refinamentos e Adições Sugeridas
- **Propagação de Erro e Recálculo (A.7.5 e A.6.2):** Ao arrumar uma regra Zen da Contabilidade (ex: CFOP 5102 mapeando pra receita errada) e forçar o recálculo sobre milhares de faturas da competência, o impacto do processamento no dispositivo (local-first) pode travar a aba do usuário. Operações de "Reclassificação Massiva Retroativa" devem obrigatoriamente entrar na "Fila de Computação Assíncrona" (RFC-010) em background.
- **Assinaturas Específicas do Perfil Contador (A.4):** A exportação final formal (SPED, ECD) requer o Certificado A1/A3 do Contador. A persona do Contador (Profile Externo Escopado) precisa prever um conector nativo para Hard Tokens PkiBrazil / Smartcards / Cifragem TLS local para assinar o batch antes de injetar no Conector Oficial.
- **Imutabilidade e Bloqueio de Competência (A.4.3):** A reabertura auditável resolve a rigidez. Porém, se o usuário do ERP tentar inserir uma NFe retroativa num mês já Fechado, o sistema rejeitará via *Predicado de Bloqueio*. É importante sugerir um UI path: A própria rejeição deveria oferecer a "Criação de Intent de Pedido de Reabertura ao Contador" no prompt de erro.

## 3. Design System & UI Layout
### Ideias de Layout
- T-Accounts Explorer: Renderizar os Razonetes clássicos em formato de "DataTable no Shell" (RFC-026) que possibilite o Drill-Down diretamente para o fato gerador do ERP.
- Time-Machine do Fiscal: Barra de tempo exibindo a Vigência de Mês com *Locks Vermelhos* para meses fechados.

### Componentes Necessários
- **Atoms:** `DebitCreditBadge`, `TaxRatePill`.
- **Molecules:** `EmployeePayrollRow` (Que resume 12 eventos de folha).
- **Organisms:** `GeneralLedgerTable` (Razão geral expansível), `FiscalClosingWizard` (Assistente de fechamento de mês que agrupa e lista as dependências incompletas, ex: "Falta classificar 5 contas a pagar").

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** Variantes de `SPEC` de Folha, Plano de Contas Versionado.
- **Arestas:** Fatos e Projeções derivados do Grafo Operacional Base.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Mutações do mês derivam registros contábeis dinamicamente na projeção.
- **Mutação:** Recálculos atualizam a projeção sob demanda (Time-Travel das Leis).
- **Fim de Vida:** O fechamento materializa estaticamente a versão aprovada (Snapshots). Exportações via Conector geram provas (`external_ref` RECIBO) arquivadas no media plane permanentemente.
