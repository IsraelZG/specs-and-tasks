---
id: adr-024-concessao-de-capacidade-e-defesa-em-profundidade
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling 2026-08-03
  - docs-v2/pt-BR/adr/ADR-021-portao-de-asset-em-avelino.md
resolve:
  - questoes-abertas.md Q-08
---

# ADR-024 — Concessão de capacidade e as camadas que sustentam o silêncio

## O ponto de partida

Conceder capacidade permanente é, ela própria, operação de `ASSET`
(`ASSET:PERMISSION`, `ASSET:ROLE`). O portão do ADR-021 gateia a própria
concessão, e a recursão termina no lugar certo: **a confirmação mais importante
do sistema é a que cria uma capacidade permanente**, porque é ela que expande
escopo e autoriza N ações futuras sem novo consentimento.

## Forma da concessão

A elevação a capacidade permanente é oferecida **inline**, no ato da
confirmação, e é **estreita por padrão**:

- o padrão é uma vez só;
- ampliar exige escolher **escopo e prazo**, ambos obrigatórios;
- não existe "sempre" nem "todos os módulos".

A revisão é uma projeção sobre as capacidades portadas, com revogação em um
passo e efeito imediato. Isso sai de graça: a capacidade já é nó assinado, com
linhagem e revogação.

## Camadas de defesa, e o limite de cada uma

### 1. Reversibilidade — espectro, não garantia

| Operação | Reverte? |
| :--- | :--- |
| edição de `CONTENT` | sim; versão nova, original preservado |
| movimentação de `ASSET` | apenas por evento compensatório, e a contraparte já detém |
| **divulgação** | **nunca**; o dado foi visto |

Num perfil com livros formais, reverter significa **compensar**, não apagar.
Nenhuma camada posterior recupera uma divulgação.

### 2. Alcance progressivo

`CONTENT` nasce com alcance limitado e escala gradualmente. Isso converte a
publicação — quase irreversível — em ação com **janela de detecção**. É a camada
de melhor relação entre custo e efeito.

Fica em aberto o que dirige a escala: tempo, engajamento, antiguidade do autor,
ou combinação.

### 3. Detecção de anomalia — função da autoridade

Frequência, volume e velocidade. Dois padrões conhecidos: ator novo com alta
velocidade; ator dormente que subitamente movimenta muito.

Isto **só funciona na autoridade**. Os sinais exigem visão cruzada entre atores,
e um Avelino cliente enxerga apenas o próprio portador.

### 4. Aprendizado de máquina muda a fricção, nunca o veredito

| ML pode | ML não pode |
| :--- | :--- |
| pedir reconfirmação | **recusar proposta** |
| exigir co-assinatura | |
| reduzir alcance, encurtar TTL | |
| sinalizar para revisão | |

A recusa é sempre de regra determinística e citável: "excedeu o limite X da
capacidade Y". Nunca "o modelo indicou risco".

O motivo é duplo. Um bloqueio sem regra citável não se defende diante de
regulador e não se contesta por quem foi bloqueado. E o README do v2 exige que
nada fique a interpretação.

### 5. Revisão periódica assistida por agente

Um agente ajuda a revisar as capacidades concedidas — inclusive as concedidas a
agentes.

**Invariante:** o agente revisor **propõe revogação, nunca ampliação**. Sem
isso, a revisão vira caminho de escalada de privilégio pelo próprio mecanismo
que existe para contê-la.

## Em aberto

- O que dirige a escala do alcance progressivo.
- Caminho de contestação quando uma regra determinística bloqueia uma operação
  legítima. Num fluxo regulado, travar uma movimentação válida por limiar é
  falha séria, e o bloqueio precisa ser legível e apelável.
