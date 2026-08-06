---
id: contexto-ilda
tipo: contexto
status: ativo
data: 2026-08-02
---

# Ilda

O catálogo de módulos reutilizáveis e dos conectores canônicos. Fica acima da
plataforma e abaixo dos produtos. Depende dos três pilares; nada depende dela,
exceto produtos.

> Ilda nasce vazia. Nenhum módulo está especificado hoje.

## Language

**Catálogo**:
O conjunto dos módulos publicados, versionados um a um. Não é pacote único.
_Evitar_: registro, biblioteca, marketplace, monorepo.

**Faceta**:
Uma das partes de um módulo, separadas por onde executam: declaração, domínio,
autoridade e cliente. Um módulo é sempre as quatro, não um bloco só.
_Evitar_: camada, pacote, slice.

**Faceta de declaração**:
Identidade, versão, capacidades e comandos do módulo. Ver [Contratos](../contratos/CONTEXT.md).

**Faceta de domínio**:
Schemas, tipos e validação determinística. Executa em Avelino.

**Faceta de autoridade**:
Handlers, tarefas e validações que só a autoridade lógica executa.

**Faceta de cliente**:
Páginas e wrappers. Compõe engines de Marilda e nunca alcança componentes ou
tokens por fora delas.

**Conector canônico**:
Conector já especificado que serve a mais de um produto e por isso vive no
catálogo, em vez de solto.
_Evitar_: conector padrão, conector oficial.
