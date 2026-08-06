---
id: contexto-contratos
tipo: contexto
status: ativo
data: 2026-08-03
---

# Contratos

O contrato e a prova da plataforma: as portas que qualquer implementação precisa
satisfazer, os esquemas que declaram extensões e perfis, e as suítes que provam
conformidade. Não depende de nenhum outro contexto.

Não recebe nome próprio porque não tem agência: nada aqui executa. Contratos é
compilado e está presente em produção como **dado**, nunca como comportamento —
Avelino lê seus esquemas para validar; Contratos não valida. Ver ADR-028.

## Language

### Contratos

**Porta**:
Contrato que declara uma capacidade exigida do ambiente, sem fixar quem a
fornece. Toda porta tem uma suíte de conformidade.
_Evitar_: interface, adapter, driver.

**Suíte de conformidade**:
Conjunto executável de vetores que uma implementação precisa passar para se
declarar conforme a uma porta. Se um comportamento não está na suíte, ele não é
contrato.
_Evitar_: testes de integração, testes de contrato.

**Implementação de referência**:
Implementação de uma porta mantida junto ao contrato para provar que ele é
satisfazível. Não define o comportamento — a suíte define.
_Evitar_: implementação padrão, implementação oficial.

### Ação e leitura

**Comando**:
Ação nomeada e invocável, declarada num dicionário, com argumentos e capacidade
exigida. É a única forma de agir sobre o sistema. Interface e agente são dois
chamadores iguais.
_Evitar_: ação, operação, mutação, handler.

**Classe de comando**:
Tempo de vida do efeito de um comando, declarado nele: `local` (tabela local do
dispositivo, sobrevive à sessão, nunca replica), `efemero` (não persiste em
lugar nenhum) ou `duravel` (vira proposta e depois registro).
_Evitar_: tipo de comando, escopo, persistência.

**Dicionário de comandos**:
Conjunto dos comandos alcançáveis num modo de implantação, montado a partir dos
manifestos ativos. Não é catálogo central. Um agente o lê para descobrir o que
pode fazer.
_Evitar_: API, catálogo de ações, registro.

> **Aposentados.** *Intent* não é mais um conceito: um comando `duravel` produz
> uma **proposta**, que confirmada vira **registro**. *Sinal de coordenação* não
> é mais um mecanismo próprio: é um comando `efemero`.

**Porta de comandos**:
Contrato de invocação de comando. Substitui o que o ADR-005 chamava de porta de
mutação.

**Porta de leitura reativa**:
Contrato de leitura em forma de store tabular observável. Só apresenta o que as
capacidades do portador autorizam; a filtragem ocorre antes do dado entrar no
store.
_Evitar_: query port, store, cache.

### Extensões

**Extensão**:
Unidade governável que se acopla à plataforma por declaração. Cobre módulo,
plugin e conector.

**Declaração**:
Identidade, versão, capacidades, permissões, comandos, ativação e revogação de
uma extensão. Schema único para os três `kind`.
_Evitar_: manifesto — "manifesto" é o lote assinado pela autoridade.

**`kind`**:
Discriminador do manifesto: `modulo`, `plugin` ou `conector`.
_Evitar_: perfil, tipo, categoria — "perfil" já tem dois outros sentidos.

**Módulo**:
Extensão declarativa: lente sobre o grafo compartilhado, páginas e intents. Não
possui banco, sincronização nem bundle de código próprios.
_Evitar_: aplicação, vertical, app, produto.

**Plugin**:
Extensão portadora de código, distribuída como bundle assinado e executada em
sandbox com limites declarados.

**Conector**:
Extensão que faz a ponte com um sistema externo, classificada de A a E, com
evidência preservada por chamada.

**Lente**:
Perspectiva de leitura e escrita de um módulo sobre o subgrafo compartilhado.
Dois módulos com lentes diferentes leem o mesmo grafo, nunca cópias.
_Evitar_: view, projeção — projeção é outra coisa.
