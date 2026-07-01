# Acesso Remoto ao Painel MGTIA (:8780)

O painel roda localmente em `http://127.0.0.1:8780`. Para acessá-lo de fora da
máquina, use **Cloudflare Tunnel** (`cloudflared`).

## Pré-requisito

Instale o `cloudflared`:
```bash
# Windows (winget)
winget install Cloudflare.cloudflared

# Ou baixe de: https://github.com/cloudflare/cloudflared/releases
```

## Modo 1 — Quick Tunnel (teste rápido)

Túnel efêmero, sem conta Cloudflare. A URL muda a cada execução.

```bash
# Suba o painel (se ainda não estiver rodando)
node scripts/headroom-proxies.mjs dashboard 8780 &

# Em outro terminal, crie o túnel
cloudflared tunnel --url http://localhost:8780
```

Copie a URL exibida (algo como `https://random-name.trycloudflare.com`).
Ela expira quando o `cloudflared` é encerrado.

> **⚠️ Risco:** sem autenticação — qualquer pessoa com a URL acessa o painel.
> Use apenas para testes rápidos.

## Modo 2 — Tunnel Nomeado + Cloudflare Access (uso real)

### 2.1 Login e criação do túnel

```bash
cloudflared tunnel login        # abre navegador p/ autorizar domínio
cloudflared tunnel create mgtia # cria túnel nomeado "mgtia"
```

Isso gera `~/.cloudflared/<UUID>.json` (credencial do túnel).

### 2.2 Configuração do túnel

Crie `~/.cloudflared/config.yml`:

```yaml
tunnel: <UUID-do-túnel>
credentials-file: C:/Users/<seu-usuario>/.cloudflared/<UUID>.json

ingress:
  - hostname: painel.seu-dominio.com
    service: http://localhost:8780
  - service: http_status:404
```

### 2.3 DNS

No Cloudflare DNS, crie um registro `CNAME`:
- **Nome:** `painel`
- **Alvo:** `<UUID>.cfargotunnel.com`

### 2.4 Cloudflare Access (gate por e-mail)

No dashboard Cloudflare → Zero Trust → Access → Applications:

1. **Add application** → Self-hosted
2. **Application name:** Painel MGTIA
3. **Domain:** `painel.seu-dominio.com`
4. **Policy:** Include → Emails ending in → `@seu-dominio.com`
5. Salve.

Agora qualquer acesso a `https://painel.seu-dominio.com` exige login com e-mail
verificado.

### 2.5 Rodar o túnel

```bash
cloudflared tunnel run mgtia
```

Para rodar como serviço Windows:
```bash
cloudflared service install
```

## Verificação

```bash
curl -s http://localhost:8780/api/status | head -c 100
# Deve retornar JSON com status dos proxies
```

Com o túnel ativo, acesse `https://painel.seu-dominio.com` e autentique-se
com o e-mail cadastrado no Access.
