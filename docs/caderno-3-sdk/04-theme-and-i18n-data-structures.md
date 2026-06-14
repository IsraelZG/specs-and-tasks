# 04-theme-and-i18n-data-structures.md — Theme & i18n Data Structures

Este documento especifica a estrutura de dados e as propriedades de tematização visual e internacionalização reativa na Plataforma Projeto SuperApp V0.41. Ambas as customizações são tratadas estritamente como **dados no grafo** e não como código.

---

## 1. Sistema de Temas Dinâmicos (`CONTENT:THEME`)

Os temas na plataforma baseiam-se em arquivos de dados estruturados YAML ou JSON salvos em nós do tipo `CONTENT:THEME`. Eles representam o nível base (App) de estilização. O sistema compila e injeta esses valores através da arquitetura de tokens (Style Dictionary), convertendo as referências para variáveis CSS Custom Properties (prefixadas com `--ds-*`) no `:root` do HTML.

*Para ver como estes temas interagem com os estilos de níveis inferiores (Módulo, Página, Instância), veja [09-hierarchical-theme-customization.md](./09-hierarchical-theme-customization.md).*

### 1.1 Vocabulário Canônico de Tokens e Overrides
A estrutura abandona mapeamentos HSL antigos em prol de um sistema de chaves achatadas (Flat Key-Value). Os temas redefinem apontamentos para as primitivas de estilo (ex: `theme.intent.*` ou `component.*`).

```yaml
# Exemplo de Payload de um nó CONTENT:THEME
content_theme:
  id: "theme_ocean_breeze"
  type: "CONTENT:THEME"
  metadata:
    name: "Ocean Breeze"
    version: "2.0.0"
    description: "Tons azulados inspirados no oceano"
  base_mode: "light"             # 'light' | 'dark'
  theme_overrides:
    # Camada de Tema (reaproveitada por todos os componentes filhos):
    "theme.surface.default":      "#f0f8ff",
    "theme.content.default":      "#001f3f",
    "theme.intent.primary.fill":  "{color.ocean.500}",
    "theme.border.subtle":        "#d0e2f5",
    
    # Camada de Componente (ajustes cirúrgicos globais):
    "card.radius":                "12px",
    "button.primary.bg":          "{theme.intent.primary.fill}"
```

### 1.2 Validação de Temas no Upload
Quando um usuário cria ou importa um tema no marketplace, o Validador de Domínio atua com o schema de `SPECIFICATION:THEME`:
* **Validação de Chaves Válidas**: Analisa se todas as chaves em `theme_overrides` estão registradas no índice canônico de tokens da plataforma.
* **Validação de Contraste WCAG**: Um lint computado (via jsdom) resolve a cascata de componentes vitais no tema. Se pares de contraste críticos (ex: botões primários contra seu texto associado) possuírem razão inferior a **4.5:1** para textos normais, a publicação recebe advertência e, caso seja uma rede sob governança rígida, pode ser bloqueada.

---

## 2. Internacionalização como Dados (`CONTENT:TRANSLATION`)

Todas as strings e rótulos de interface na plataforma são internacionalizados reativamente consumindo nós do tipo `CONTENT:TRANSLATION`. O TinyBase observa a tradução selecionada pelo usuário e atualiza a interface dinamicamente.

### 2.1 Estrutura do Nó de Tradução
O payload do nó contém metadados de idioma/região e o dicionário plano mapeando chaves de tradução:

```yaml
content_translation:
  id: "translation_pt_br"
  type: "CONTENT:TRANSLATION"
  metadata:
    language: "pt"
    region: "BR"
    version: "2.1.0"
    coverage_percentage: 100.0
  strings:
    # Rótulos Genéricos
    "common.actions.save": "Salvar"
    "common.actions.cancel": "Cancelar"
    
    # Rótulos do Chat
    "chat.placeholders.input": "Digite uma mensagem..."
    
    # Rótulos de Ativos e Financeiro
    "fintech.balance.label": "Saldo Disponível"
    
    # Pluralização estruturada
    "notification.unread.count":
      one: "Você tem 1 mensagem não lida"
      other: "Você tem {count} mensagens não lidas"
```

### 2.2 Validação de chaves
O validador garante que:
* Os placeholders (ex: `{count}`, `{name}`) presentes nas strings canônicas sejam preservados na string traduzida.
* Não existam injeções de scripts maliciosos nos payloads textuais.

---

## 3. Distribuição via Marketplace de Customizações

Os nós do tipo `CONTENT:THEME` e `CONTENT:TRANSLATION` são catalogados e descobertos por meio do **Marketplace de Customizações**.
* Em redes públicas, a instalação é livre e regulada pela reputação dos publicadores.
* Em redes corporativas, os administradores podem forçar temas corporativos específicos via `SPECIFICATION:NETWORK_GOVERNANCE`, mas o usuário sempre retém o direito de forçar o contraste e o modo de acessibilidade localmente.


