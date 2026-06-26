# ADR — Noise_XX: biblioteca + binding Ed25519↔X25519

- **Status:** aceito (spike T-200, 2026-06-24)
- **Contexto:** desbloqueia a T-202 (handshake Noise_XX sobre `NetworkAdapterPort`)
- **Decisores:** arquiteto (via spike T-200)

## Problema

A spec da T-202 carregava duas premissas furadas:
1. A "lib de referência" `@noise-crypto/noise` **não existe** (npm E404).
2. Noise_XX usa chave estática **X25519 (DH)**; a Device Key do projeto (T-104/T-105) é **Ed25519
   (assinatura)** — incompatível como chave estática de DH. A contradição "a chave estática do
   Noise_XX é a chave do dispositivo" (caderno-5 §2.2.1) precisava de resolução.

## Verificação no npm (2026-06-24, `npm view`)

| Pacote | Existe? | Última publicação | Deps nativas | Isomórfico | Veredito |
|--------|---------|-------------------|--------------|------------|----------|
| `@noise-crypto/noise` | ❌ **E404** | — | — | — | não existe |
| `noise-c.wasm` | ✅ v0.4.0 | **2022-05** (estagnado) | zero (WASM) | ✅ | fallback |
| `noise-protocol` | ✅ v3.0.2 | — | **`sodium-universal`, `hmac-blake2b`** (addons nativos) | ❌ Node-only | **rejeitado** (quebra em Windows ARM64 / browser) |
| `@noble/ciphers` | ✅ v2.2.0 | **2026-04** (ativo) | zero (JS puro) | ✅ | **escolhido** |
| `@noble/curves` | ✅ v2.2.0 | **2026-04** (ativo) | zero (JS puro) | ✅ | **escolhido** (já usado por T-101) |

## Decisões

### D1 — Pacote: `@plataforma/transport`
Noise consome `NetworkAdapterPort` (T-004) e expõe canais `send`/`receive` — é primitiva de
transporte. `@plataforma/crypto` fica puro/matemático/síncrono. Pôr Noise no crypto criaria
dependência `crypto → protocol`, violando a direção de dependências (protocol é folha). **Confirma a
proposta do endurecedor.**

### D2 — Biblioteca: **montar Noise_XX mínimo sobre `@noble/*`** (não usar lib de terceiros)
`@noble/curves` (X25519) + `@noble/ciphers` (ChaCha20-Poly1305) + `@noble/hashes` (SHA-256/BLAKE2s).
Razão: a única lib isomórfica sem deps nativas (`noise-c.wasm`) está **estagnada (2022)** e é um
wrapper C; `noise-protocol` tem **addons nativos** que quebram nesta máquina (Windows 11 **ARM64**) e
no browser; `@noise-crypto/noise` não existe. A suíte `@noble/*` é **o que o projeto já usa (T-101)**,
ativa (2026), zero-dep, isomórfica — e o PoC abaixo prova que os building blocks fecham.

> **Isto revoga a regra "NÃO implemente o Noise do zero" da T-202 §5** — essa regra assumia existir
> uma lib isomórfica mantida; não existe. **Mitigações obrigatórias:** implementar **apenas o padrão
> XX** (não o framework inteiro); **validar contra os test vectors oficiais do Noise**; manter pequeno
> (~200–300 LOC); revisão criptográfica dedicada. **Fallback** se o time rejeitar hand-roll:
> `noise-c.wasm` (aceitando estagnação + complexidade de bundling WASM).

### D3 — Binding Ed25519↔X25519: **channel binding sobre o handshake hash**
Noise_XX roda com chave estática **X25519**; a identidade **Ed25519** do device liga-se à sessão
**assinando o handshake hash `h` do Noise** com a Device Key. O "nonce assinado com Ed25519" da spec
**é exatamente essa assinatura** — não um nonce ad-hoc. **Sem timestamp** (o efêmero do Noise já dá
frescor; elimina dependência de relógio) e **sem derivação blake2s inventada**. A contraparte verifica
a assinatura contra a Ed25519 pubkey do `DevicePeerId = blake2s256(devicePub)` esperado.

> Isto **supera** as opções "nonce = random+timestamp" e "nonce = blake2s256(...)" das análises
> anteriores: a resposta certa é **assinar o transcript do Noise**, não fabricar um nonce.

A chave estática X25519 é **provisionada por dispositivo junto da Ed25519** (pequeno ripple em T-104)
**ou** efêmera por sessão com a autenticação vindo inteiramente do binding Ed25519. Decisão de
provisionamento fica para T-104/T-202 (ver Ripples).

### D4 — Tipo do keypair: definir **localmente em `transport`**, com `privateKey`
**Não** importar `Ed25519Keypair` de `@plataforma/crypto` — **esse tipo não existe**. O crypto exporta
`Ed25519PublicKey`/`Ed25519PrivateKey` (ambos `Uint8Array`) e `ed25519GenerateKeyPair()` retorna
`{ publicKey, privateKey }`. Definir em `transport`:
```ts
import type { Ed25519PublicKey, Ed25519PrivateKey } from '@plataforma/crypto';
export interface Ed25519Keypair {
  publicKey: Ed25519PublicKey;
  privateKey: Ed25519PrivateKey;   // ⚠️ privateKey — NÃO "secretKey"
}
```
Trivial, backward-compatível, não bloqueia esperando alteração no T-101 (done).

## PoC (executado — evidência)

Rodado standalone com as libs reais (`@noble/curves@2.2.0`, `@noble/ciphers@2.2.0`,
`@noble/hashes`), Node v22, **6/6 verde**:

```
PASS: X25519 DH: ambos os lados derivam o mesmo segredo compartilhado
PASS: ChaCha20-Poly1305: roundtrip do canal cifrado (ida e volta)
PASS: Channel binding: assinatura Ed25519 do device sobre o handshake hash confere
PASS: DevicePeerId = blake2s256(devicePub) deterministico
PASS: Binding rejeita device key errada
PASS: Binding rejeita transcript adulterado
```

Imports validados (noble v2 exige subpath `.js`): `@noble/curves/ed25519.js` → `{ ed25519, x25519 }`;
`@noble/ciphers/chacha.js` → `chacha20poly1305`. O código do PoC está reproduzido no log de execução
da T-200 (Seção 8). A versão canônica em Vitest deve entrar no worktree da T-202.

## Ripples para a re-endurecimento da T-202

1. **Re-dimensionar T-202:** com Noise_XX hand-rolled, deixa de ser sonnet casual → **opus** (ou
   sonnet com test vectors do Noise + revisão cripto dedicada).
2. **Contrato:** trocar o import `Ed25519Keypair` pelo tipo local (`privateKey`); o "nonce assinado"
   vira assinatura Ed25519 sobre o handshake hash; decidir se a X25519 static é provisionada ou efêmera.
3. **Deps:** adicionar `@noble/ciphers` e `@noble/curves` ao `packages/transport/package.json`.
4. **Ripple em T-104/T-105:** se a X25519 static for persistente por device, T-104 precisa
   provisioná-la junto da Ed25519 — flag para o dono dessas tasks.
5. **Test vectors:** T-202 deve incluir um caso que valide o handshake contra os vetores oficiais do
   Noise_XX (anti-bug do hand-roll).
