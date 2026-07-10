# Handoff — Mockups Lovable com Emulação TinyBase

**Data:** 2026-07-02  
**Contexto:** SuperApp V0.41 — design system + mockups de UI via Lovable

---

## Decisões fechadas (não reabrir)

| Eixo | Decisão |
|---|---|
| Paleta de cores | Usar hex hand-picked do protótipo como placeholder provisório. T-DS-05 (opus-spike OKLCH/HCT) decide a definitiva — não bloquear Lovable por isso. |
| Ordem dos mockups | 1º shell/onboarding (A1-A2), depois Mensageria (B1). |
| Componentes piloto | Todos já implementados no protótipo (`Card`, `Message`, `NavItem`, `Toast` + Button, Input). Não recriar do zero no Lovable — usar o design system. |

---

## O Problema: Lovable ≠ stack real

O app real usa **TinyBase** como única fonte de dados na UI — toda leitura e escrita passa por `useRow`, `useCell`, `useTable`, `useQueries` (hooks do TinyBase). A camada de persistência real usa Comlink + Web Worker + SQLite (arquivos em `apps/web/src/store/tinybase.ts`).

O Lovable não tem como rodar isso. O objetivo é que o código de UI gerado pelo Lovable seja **diretamente reaproveitável** quando a persitência real for plugada, sem refatoração.

---

## Estratégia: Fake Persister, API Real

Preservar a API pública do TinyBase exatamente (`createStore`, hooks React), mas trocar o persister pesado por um fake em memória/localStorage.

### O que instalar no projeto Lovable

```bash
npm install tinybase
```

### `src/store/store.ts` — loja singleton com persister fake

```ts
import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-local-storage';

// Mesmo createStore de produção — a UI não sabe o que está por baixo.
export const store = createStore();

// Persister fake: localStorage em vez de SQLite/Worker.
// Trocar por createWorkerPersister(...) quando for pro ambiente real.
const persister = createLocalPersister(store, 'superapp-mockup');
persister.startAutoLoad(initialData).then(() => persister.startAutoSave());

// Dados iniciais para os mockups não começarem vazios.
const initialData = {
  tables: {
    conversations: {
      'conv-1': { title: 'Alice', lastMessage: 'Oi, tudo bem?', unread: 2, timestamp: Date.now() - 60000 },
      'conv-2': { title: 'Grupo Produto', lastMessage: 'Review às 15h', unread: 0, timestamp: Date.now() - 3600000 },
    },
    messages: {
      'msg-1': { conversationId: 'conv-1', author: 'received', body: 'Oi, tudo bem?', timestamp: Date.now() - 60000 },
      'msg-2': { conversationId: 'conv-1', author: 'sent', body: 'Tudo ótimo!', timestamp: Date.now() - 55000 },
    },
    currentUser: {
      'me': { name: 'Israel', avatarUrl: '' },
    },
  },
  values: {
    activeConversationId: 'conv-1',
    theme: 'light',
  },
};
```

### `src/store/hooks.ts` — re-exportar hooks do TinyBase

```ts
// Re-exporta os hooks oficiais — a UI importa daqui, não direto do tinybase.
// Quando o store mudar para produção, só este arquivo muda.
export {
  useRow,
  useCell,
  useTable,
  useSortedRowIds,
  useRowIds,
} from 'tinybase/ui-react';
export { useQueries, useResultTable, useResultRowIds } from 'tinybase/ui-react';
export { store } from './store';
```

### `src/main.tsx` — Provider no topo

```tsx
import { Provider } from 'tinybase/ui-react';
import { store } from './store/store';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

---

## Como a UI consome (padrão que o Lovable deve seguir)

```tsx
// Lovable escreve assim — não muda nada quando o persister real for plugado.
import { useRow, useRowIds, useCell } from '@/store/hooks';

function ConversationList() {
  const ids = useRowIds('conversations');
  return (
    <ul>
      {ids.map(id => <ConversationItem key={id} id={id} />)}
    </ul>
  );
}

function ConversationItem({ id }: { id: string }) {
  const title = useCell('conversations', id, 'title');
  const unread = useCell('conversations', id, 'unread');
  return <li>{title} {unread > 0 && <Badge>{unread}</Badge>}</li>;
}
```

**Regra para o Lovable:** nunca passar dados via props estáticas — sempre `useRow`/`useCell`/`useTable`. Assim o mockup já é "real" sob capô.

---

## Design System no Lovable

O protótipo está em `C:\Dev2026\Design System\design-system`. Os componentes piloto prontos:

- `Button` — variantes primary/secondary/ghost/danger × sm/md/lg
- `Input` — leading/trailing icon, estados invalid/disabled/readOnly
- `Card` — polymórfico (div/article/button/a), padding none/sm/md/lg, interactive
- `Message` — author sent/received/ai/system, status de entrega, density cozy/compact
- `NavItem` — as a/button, tone default/inverse, collapsed, active
- `Toast` — intent info/success/warning/danger, auto-dismiss, timer pause on hover

**No Lovable:** copiar os `.tsx` dos componentes + `globals.css` (com o bloco `@theme inline`) + o CSS compilado dos tokens (output do Style Dictionary em `tokens-light.css` / `tokens-dark.css`). Os componentes só usam `var(--ds-component-*)` — não têm cor hardcoded.

---

## Ordem dos mockups

### Fase 1 — Shell/Onboarding (A1-A2) — entram primeiro sempre
Telas obrigatórias antes de qualquer módulo:
- A1: layout base (sidebar + conteúdo), NavItem ativo, tema claro/escuro
- A2: tela de onboarding / criação de identidade

### Fase 2 — Mensageria (B1) — prioridade de negócio
Telas ⭐ (mockup-first, segundo `inventario-de-telas.md`):
- Lista de conversas (estado vazio + carregando + populado)
- Conversa 1:1 (bolhas Message, scroll, compositor)
- Conversa em grupo
- Compositor (input + attach)
- Chamada/conferência (LiveKit — só layout, sem funcionalidade real)

Estados obrigatórios por tela (gate do agile-reviewer conforme `diretrizes-ux.md` §6):
`vazio` · `carregando` (skeleton) · `erro` (com retry) · `offline` · `sem-permissão` · `sincronizando` · `parcial/pendente`

---

## O que NÃO fazer no Lovable

- Não hardcodar cores/espaçamentos — só tokens `var(--ds-*)` ou classes Tailwind que apontem para eles
- Não buscar dados via fetch/API — só TinyBase hooks
- Não criar componentes atômicos novos (Badge, Avatar, etc.) se não existirem no design system — improvisar com HTML+token até o componente formal existir
- Não reutilizar `as="div"` com `onClick` — Card e NavItem têm semântica polimórfica para isso

---

## Tarefas formais relacionadas (todas `draft`, não tocar no status)

| Task | Descrição | Depende de |
|---|---|---|
| T-011 | Incorporar design-system ao monorepo | — |
| T-DS-01 | Importar pacote de tokens + Style Dictionary | T-011 |
| T-DS-02 | Schema de metadados AI-ready + índice + CI | T-DS-01 |
| T-DS-03 | Portar componentes-piloto pro monorepo | T-DS-01, T-DS-02 |
| T-DS-05 | Identidade visual definitiva (OKLCH/HCT) | T-011 |
| T-SHL-01 | Shell FlexLayout + SPEC:WORKSPACE | — |
| T-MSG-01 | Mensageria + integração DM social | — |

O trabalho de Lovable é **protótipo de UI, fora da cadeia MGTIA** — os mockups alimentam os requisitos visuais para quando essas tasks forem executadas, mas não precisam passar por `manage-task.mjs`.
