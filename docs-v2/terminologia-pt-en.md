---
id: terminologia-pt-en
tipo: terminologia
status: ativo
data: 2026-08-02
---

# Terminologia pt-BR → en

A especificação é escrita em português. Esta tabela fixa o termo inglês
correspondente, para o texto técnico que os workers consomem.

Regras: um conceito tem um nome em cada idioma. O termo inglês segue ASD-STE100
— palavra curta, um sentido só, voz ativa, sem adjetivo de marketing. Termos na
coluna *Evitar* são proibidos nos dois idiomas.

---

## Plataforma e produto

| pt-BR | en | Definição | Evitar |
| :--- | :--- | :--- | :--- |
| Plataforma | Platform | O conjunto dos três pilares. Nome provisório: SuperApp. | framework, stack, system |
| Pilar | Pillar | Avelino, Marilda ou Contratos. Versionável e adotável de forma independente. | product, component, layer |
| Produto | Product | Composição declarada sobre a plataforma. CoopCentral é o primeiro. Não é código. | application, solution, app |
| Declaração de produto | Product declaration | Que módulos um produto ativa, que perfis aplica, que identidade usa. | config, deployment spec |
| Catálogo | Catalog | Onde os módulos são publicados. Nem plataforma, nem produto. | registry, library, marketplace |
| Avelino | Avelino | O núcleo: identidade, permissões, grafo, feed, sincronização, transporte. | core, backend, server |
| Marilda | Marilda | A camada de experiência: vocabulário visual, engines e motor de páginas. | frontend, UI layer |
| Contratos | Contracts | O contrato e a prova da plataforma. Não depende de nenhum outro contexto. Sem nome próprio: não tem agência. | standards, shared, common, sdk |
| Ilda | Ilda | O catálogo de módulos reutilizáveis e conectores canônicos. Fica acima da plataforma. | module library, monorepo |
| Faceta | Facet | Parte de um módulo, separada por onde executa: declaração, domínio, autoridade, cliente. | layer, slice |
| Conector canônico | Canonical connector | Conector especificado que serve a mais de um produto e vive no catálogo. | default connector |

## Contratos

| pt-BR | en | Definição | Evitar |
| :--- | :--- | :--- | :--- |
| Porta | Port | Contrato que declara uma capacidade exigida do ambiente. | interface, adapter, driver |
| Suíte de conformidade | Conformance suite | Vetores executáveis que uma implementação passa para se declarar conforme. | contract tests |
| Implementação de referência | Reference implementation | Implementação mantida junto ao contrato para provar que ele é satisfazível. | default, official implementation |
| Porta de comandos | Command port | Contrato de invocação de comando. | mutation port, write API |
| Porta de leitura reativa | Reactive read port | Contrato de leitura em store tabular observável. | query port, store |

## Ação

| pt-BR | en | Definição | Evitar |
| :--- | :--- | :--- | :--- |
| Comando | Command | Ação nomeada e invocável. Única forma de agir sobre o sistema. | action, operation, mutation, handler |
| Classe de comando | Command class | Tempo de vida do efeito: `local`, `efemero` ou `duravel`. | type, scope |
| `local` | `local` | Efeito em tabela local. Sobrevive à sessão. Nunca replica. | client-side, offline |
| `efemero` | `ephemeral` | Efeito não persiste. Só alcança quem escuta agora. | transient, signal |
| `duravel` | `durable` | Efeito vira proposta e depois registro no grafo. | persistent, committed |
| Dicionário de comandos | Command dictionary | Comandos alcançáveis num modo de implantação. Não é catálogo central. | API, action catalog |

## Dados

| pt-BR | en | Definição | Evitar |
| :--- | :--- | :--- | :--- |
| Proposta | Proposal | Escrita submetida e ainda não confirmada. | command, transaction, draft |
| Registro | Record | Fato confirmado e imutável no grafo. | row, entry, document |
| Projeção | Projection | Tabela derivada do grafo. Reconstruível. Nunca fonte de verdade. | cache, view, index |
| Estado de vista | View state | Estado que só existe para a interface. Nunca deriva do grafo. | local state, cache, draft |
| Lente | Lens | Perspectiva de um módulo sobre o subgrafo compartilhado. | view, projection |

## Autoridade e rede

| pt-BR | en | Definição | Evitar |
| :--- | :--- | :--- | :--- |
| Autoridade lógica | Logical authority | Função de governo de uma rede. Única por rede. | server, system peer, central node |
| Feed autoritativo | Authoritative feed | Sequência ordenada de lotes confirmados. | log, stream, changelog |
| Capacidade | Capability | Autorização delegável e revogável. Autoriza a requisição. | permission, role, token |
| P2P oportunístico | Opportunistic P2P | Entrega direta de bytes entre portadores autorizados. | P2P network, mesh, gossip |

## Extensões

| pt-BR | en | Definição | Evitar |
| :--- | :--- | :--- | :--- |
| Extensão | Extension | Unidade governável que se acopla por declaração. | add-on, package |
| Declaração | Declaration | Identidade, versão, capacidades, comandos e revogação de uma extensão. | manifest, descriptor, config |
| `kind` | `kind` | Discriminador da declaração: `modulo`, `plugin` ou `conector`. | perfil, type, category |
| Módulo | Module | Extensão declarativa: lente, páginas e comandos. Sem banco próprio. | app, vertical, product |
| Plugin | Plugin | Extensão portadora de código, em bundle assinado e sandbox. | addon, script |
| Conector | Connector | Extensão que faz ponte com sistema externo. Classes A a E. | integration, adapter |
| Perfil regulatório | Regulatory profile | Restrições declaradas que endurecem uma rede. Sempre termo composto. | profile, compliance mode |
| Gramática de perfil | Profile grammar | O que um perfil regulatório pode restringir. | policy schema |

## Interface

| pt-BR | en | Definição | Evitar |
| :--- | :--- | :--- | :--- |
| Token | Token | Valor semântico do vocabulário visual. Nomeado por intenção. | theme variable, style constant |
| Componente | Component | Peça visual sem regra de negócio, com nome estável de catálogo. | primitive, atom, widget |
| Engine | Engine | Peça funcional transversal e agnóstica de domínio. | complex component |
| Wrapper | Wrapper | Composição nomeada de uma engine para um domínio. Vive no módulo. | app component, container |
| Motor de páginas | Page engine | Interpretador que monta a árvore de engines a partir de uma especificação. | renderer, page runtime |

---

## Colisões resolvidas

| Palavra | Colidia em | Resolução |
| :--- | :--- | :--- |
| manifesto | lote assinado pela autoridade × declaração de extensão | **manifesto** fica com o lote (sentido literal: lista de conteúdo de uma carga, e 39 ocorrências em 7 documentos normativos). A extensão tem **declaração**. |
| perfil | nó `PROFILE` × perfil regulatório × discriminador de extensão | o discriminador virou **`kind`**. "Perfil regulatório" só aparece como termo composto. **Perfil** nu fica com o nó `PROFILE`. |
| intent | conceito × nó `CONTENT:INTENT` × comando durável | aposentado. Um comando `duravel` produz **proposta**, que confirmada vira **registro**. |
| sinal | coordenação efêmera com registry próprio | aposentado. É um comando de classe `efemero`. |
| estado local | rascunho de escrita × cache × estado de tela | estado de tela virou **estado de vista**. |
