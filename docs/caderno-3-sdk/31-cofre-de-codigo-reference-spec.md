# 31-cofre-de-codigo-reference-spec.md — Cofre de Código (Reference Spec)

> **Ângulo deste capítulo:** o módulo de referência que guarda **código de usuário** na plataforma —
> arquivos e repositórios trazidos de fora ("apenas guardado, como GitHub"), versionados e
> pesquisáveis. Não introduz mecânica nova: é vocabulário de [[node]]s/[[edge]]s/SPECs sobre os
> primitivos existentes — blobs content-addressed com [[convergent-encryption]] (caderno-3/05),
> linhagem assinada com supersessão, e o padrão de módulo dos reference-specs (cadernos 15–29).
> Insight estrutural: **git é, por baixo, blobs endereçados por conteúdo + árvores + commits
> assinados formando um DAG — exatamente os primitivos que o grafo já tem.** Este capítulo mapeia o
> vocabulário em duas versões: **v1** (cofre de arquivos, só storage) e **v2** (object model do git
> de verdade). v2 está especificado por antecipação — não é compromisso de construção.

## §1 — Escopo e não-objetivos

- **É:** guardar, versionar, navegar e buscar código do usuário; alimentar agentes de IA com esse
  código via o provedor de contexto (caderno 30 §7); base para o dev interno (criar telas/componentes
  sob demanda) referenciar código externo do usuário.
- **Não é (nem em v2):** CI/CD, code review, issues/PRs, execução de código do cofre. Execução é
  sempre do plano de computação ([[plugin]], caderno 12), nunca privilégio do cofre.
- Permissões, criptografia, sync e retenção: **herdados**, sem regra especial — um arquivo de código
  é um [[content]] como qualquer outro.

## §2 — v1: Cofre de Arquivos (storage puro)

Vocabulário mínimo, quase só SPEC:

1. **`CONTENT:CODE_FILE`** — um arquivo de código. Payload = referência a blob no plano de mídia
   (caderno-3/05; arquivos de código são pequenos, mas o plano já resolve chunking/transporte).
   Metadados no nó: `path` (relativo ao repositório), `language` (detectada por extensão),
   `size`, `hash` do blob. `searchable: true` (FTS) e `embeddable: true` (caderno 14 §2) por padrão.
2. **`CONTENT:CODE_REPO`** — a raiz nomeada de um conjunto de arquivos (`name`, `description`,
   `origin` opcional — URL de onde veio, só informativa). Arestas `CONTAINS` → `CODE_FILE`.
   Diretórios **não são nós** em v1: `path` do arquivo carrega a hierarquia (renderizada em árvore
   pela UI). Menos nós, mesma informação.
3. **Versionamento = supersessão.** Editar/re-importar um arquivo cria nova versão do
   `CODE_FILE` na linhagem normal; o head vigente é a versão corrente. Um "snapshot" do repo inteiro
   é um nó **`CONTENT:CODE_SNAPSHOT`** com arestas `SNAPSHOT_OF` → os heads no momento (o "commit"
   do pobre: nomeável, restaurável, sem DAG próprio).
4. **Dedup grátis:** [[convergent-encryption]] já garante que o mesmo arquivo importado por dois
   usuários (ou presente em dois repos) compartilha o blob — o mesmo papel dos objects do git.
5. **Import/export:** upload de diretório/zip → um `CODE_REPO` + `CODE_FILE`s; export = zip dos
   heads (ou de um `CODE_SNAPSHOT`). Nada de protocolo git em v1.
6. **Arquivamento:** linhagens longas de `CODE_FILE` são as candidatas ideais ao **pack de
   linhagem** (caderno-3/02 §4.1) — versões de código em claro delta-comprimem excepcionalmente bem.

## §3 — v2: Object model do git (especificado por antecipação)

Quando valer hospedar repositórios git *de verdade* (clone/push), o mapeamento é 1-para-1 — a
isomorfia é o motivo de v2 ser barato de especificar agora:

| objeto git | na plataforma | nota |
|---|---|---|
| blob | blob content-addressed do plano de mídia | **mesmos bytes, mesmo hash-por-conteúdo**; dedup convergente ≈ object store do git |
| tree | nó `CONTENT:GIT_TREE` (lista `{mode, name, hash}`) | imutável, endereçado por hash — como no git |
| commit | nó `CONTENT:GIT_COMMIT` (tree, parents[], author, message) | arestas `PARENT_OF` formam o DAG; a **assinatura do nó** dá autoria verificável nativa (mais forte que o autor declarado do git) |
| ref/branch | nó `CONTENT:GIT_REF` (name → hash de commit) | o único objeto **mutável** — versiona por supersessão normal (head do ref = branch atual) |
| packfile | **pack de linhagem** (caderno-3/02 §4.1) | o desenho já é o do packfile; histórico frio arquiva igual |

Regras de v2:
1. **Fidelidade byte-a-byte:** objetos git são armazenados com seus bytes canônicos — o SHA do git é
   recomputável e o repo exportado é bit-idêntico. A plataforma **não re-serializa** (mesma regra
   das assinaturas no pack de linhagem).
2. **Bridge de protocolo é plugin:** `git clone/push` contra o cofre é um [[plugin]] de computação
   que fala smart-protocol e traduz para intents de nós — o cofre em si continua storage passivo.
3. **Permissão por repo:** [[asset-permission]] no nó `CODE_REPO`/refs; não há ACL por arquivo em v2
   (fronteira = repositório, como no GitHub).
4. **v1 → v2 é aditivo:** `CODE_FILE`/`CODE_SNAPSHOT` continuam válidos; um repo v1 pode ser
   "promovido" gerando commits sintéticos a partir dos snapshots (melhor-esforço, documentado).

## §4 — Integração com IA (o porquê do cofre existir além de backup)

1. **Provedor de contexto de código** (caderno 30 §7): índice trigram + fatia simbólica
   (tree-sitter/WASM) rodam **sobre os heads do cofre** como projeções derivadas (irmãs do FTS,
   caderno 14 §2) — o código guardado vira pesquisável e alimentável a agentes com orçamento de
   tokens (crusher/CCR do caderno 30 §3).
2. **Dev interno e externo:** o agente que cria telas/componentes sob demanda (caderno 14 §5.3)
   pode ler referências do cofre ("faça como neste componente que eu trouxe"); o dev externo
   (filesystem) pode sincronizar uma worktree ↔ cofre via plugin.
3. Recuperação respeita permissões como sempre (caderno 14 §3.2) — IA não lê repo que o principal
   não pode ler.

## §5 — Limites honestos

- v1 não preserva histórico git de origem (só o que for importado por snapshot) — quem precisa do
  DAG real espera v2.
- v2 não é federação de forge: sem issues/PRs/CI. É hospedagem de repositório, ponto.
- Repos gigantes (monorepos, node_modules vendorado) estressam o plano de blobs — o import deve
  respeitar ignore-patterns (default: `.gitignore` do próprio repo).
