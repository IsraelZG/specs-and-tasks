import { useState } from 'react';
import { Button, Card, Badge, Input, Message, NavItem } from '@plataforma/design-system';

const now = new Date();

const intents = ['primary', 'accent', 'success', 'warning', 'danger', 'info', 'blush'];
const palettes = ['neutral', 'lavender', 'blush', 'sage', 'amber', 'coral', 'ocean'];
const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

export default function HomeSection() {
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');
  const [simulatedFocus, setSimulatedFocus] = useState(false);

  return (
    <section id="overview" className="pt-10 pb-20 border-b border-[color:var(--ds-theme-border-subtle)] text-left">
      {/* HERO */}
      <div className="mb-20">
        <p className="ds-overline mb-3">Multi-platform · Themable · White-label ready</p>
        <h2 className="font-[family:var(--ds-font-family-display)] text-[length:var(--ds-font-size-5xl)] font-bold leading-none tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)]">
          The same tokens.<br />Four platforms. Endless themes.
        </h2>
        <p className="text-[length:var(--ds-font-size-md)] leading-[var(--ds-font-line-height-normal)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch] mt-4">
          Componentes leem apenas tokens semânticos. Trocar de tema, mudar densidade ou rebrand para um cliente
          white-label não toca o código de produto — só os tokens. CSS, JS/TS, React Native, iOS e Android saem
          do mesmo arquivo de origem.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <Button variant="primary">Get started →</Button>
          <Button variant="secondary">View tokens</Button>
          <Button variant="ghost">Docs</Button>
        </div>
      </div>

      {/* COLOR INTENTS */}
      <div className="mb-20">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">
          Color · Intents
        </h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          Sete famílias semânticas. Cada uma traz <code>fill</code>, <code>onFill</code>, <code>subtle</code>, <code>onSubtle</code>, <code>border</code> e <code>strong</code> — combinações com contraste já validado.
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
          {intents.map(name => (
            <div
              key={name}
              className="rounded-[var(--ds-radius-xl)] overflow-hidden bg-[var(--ds-theme-surface-default)] border border-[var(--ds-theme-border-subtle)] shadow-[var(--ds-theme-shadow-xs)]"
            >
              <div className="h-20" style={{ background: `var(--ds-theme-intent-${name}-fill)` }} />
              <div className="p-3 text-[length:var(--ds-font-size-xs)]">
                <b className="block text-[color:var(--ds-theme-content-strong)] font-[var(--ds-font-weight-semibold)] capitalize">{name}</b>
                <code className="font-[var(--ds-font-family-mono)] text-[color:var(--ds-theme-content-muted)] text-[10px]">theme.intent.{name}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEUTRAL & PALETTE */}
      <div className="mb-20">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">
          Color · Palette scales
        </h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          Escalas primitivas. Não use direto em componentes — passe pela camada semântica.
        </p>
        <div className="space-y-5">
          {palettes.map(p => (
            <div key={p}>
              <p className="ds-overline capitalize mb-2">{p}</p>
              <div className="grid grid-cols-11 gap-1 rounded-xl overflow-hidden">
                {steps.map(s => {
                  const stepNum = parseInt(s, 10);
                  const textColor = stepNum > 500 ? '#fff' : '#000';
                  return (
                    <div
                      key={s}
                      title={`${p}.${s}`}
                      className="h-14 flex items-end justify-center pb-1.5 text-[10px] font-[var(--ds-font-family-mono)] font-medium"
                      style={{
                        background: `var(--ds-color-${p}-${s})`,
                        color: textColor,
                      }}
                    >
                      {s}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TYPOGRAPHY */}
      <div className="mb-20">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">Typography</h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          Display em <b>Fraunces</b> (serifa moderna com opsz variável) para momentos editoriais, UI em <b>Inter</b>, código em <b>JetBrains Mono</b>. Trocar fontes em white-label = um override em <code>font.family.*</code>.
        </p>
        <Card padding="md" className="divide-y divide-[color:var(--ds-theme-border-subtle)]">
          <div className="grid grid-cols-[200px_1fr] gap-6 py-4">
            <code className="font-[family:var(--ds-font-family-mono)] text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)] self-center">displayXl</code>
            <h1 className="font-[family:var(--ds-font-family-serif)] text-[length:var(--ds-font-size-7xl)] font-bold leading-none tracking-[-0.04em] text-[color:var(--ds-theme-content-strong)] m-0">Aa</h1>
          </div>
          <div className="grid grid-cols-[200px_1fr] gap-6 py-4">
            <code className="font-[family:var(--ds-font-family-mono)] text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)] self-center">displayLg</code>
            <h1 className="font-[family:var(--ds-font-family-serif)] text-[length:var(--ds-font-size-5xl)] font-bold leading-none tracking-[-0.02em] text-[color:var(--ds-theme-content-strong)] m-0">The quick brown fox</h1>
          </div>
          <div className="grid grid-cols-[200px_1fr] gap-6 py-4">
            <code className="font-[family:var(--ds-font-family-mono)] text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)] self-center">displayMd</code>
            <h2 className="font-[family:var(--ds-font-family-serif)] text-[length:var(--ds-font-size-4xl)] font-semibold leading-none tracking-[-0.02em] text-[color:var(--ds-theme-content-strong)] m-0">The quick brown fox jumps</h2>
          </div>
          <div className="grid grid-cols-[200px_1fr] gap-6 py-4">
            <code className="font-[family:var(--ds-font-family-mono)] text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)] self-center">headingXl</code>
            <h3 className="font-[family:var(--ds-font-family-display)] text-[length:var(--ds-font-size-3xl)] font-semibold leading-snug text-[color:var(--ds-theme-content-strong)] m-0">Headings carry structure</h3>
          </div>
          <div className="grid grid-cols-[200px_1fr] gap-6 py-4">
            <code className="font-[family:var(--ds-font-family-mono)] text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)] self-center">headingLg</code>
            <h4 className="text-[length:var(--ds-font-size-2xl)] font-semibold leading-snug text-[color:var(--ds-theme-content-strong)] m-0">Sections need a clear voice</h4>
          </div>
          <div className="grid grid-cols-[200px_1fr] gap-6 py-4">
            <code className="font-[family:var(--ds-font-family-mono)] text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)] self-center">bodyMd</code>
            <p className="text-[length:var(--ds-font-size-md)] leading-[var(--ds-font-line-height-normal)] text-[color:var(--ds-theme-content-default)] m-0 max-w-[60ch]">Body copy is the silent workhorse of every interface. It needs to be legible at 16px, breathe at 1.5 line-height, and never compete with headlines for attention.</p>
          </div>
          <div className="grid grid-cols-[200px_1fr] gap-6 py-4">
            <code className="font-[family:var(--ds-font-family-mono)] text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)] self-center">label</code>
            <p className="text-[length:var(--ds-font-size-sm)] font-medium text-[color:var(--ds-theme-content-strong)] m-0">Field label</p>
          </div>
          <div className="grid grid-cols-[200px_1fr] gap-6 py-4">
            <code className="font-[family:var(--ds-font-family-mono)] text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)] self-center">caption</code>
            <p className="text-[length:var(--ds-font-size-xs)] font-medium text-[color:var(--ds-theme-content-muted)] tracking-[0.02em] m-0">Captions sit beneath things and explain them</p>
          </div>
        </Card>
      </div>

      {/* BUTTONS */}
      <div className="mb-20">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">Buttons</h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          Pill-shaped por padrão (puxando do aesthetic das referências). Variants: primary (contraste forte preto/branco), secondary (outline), ghost (sem fundo), danger.
        </p>
        <Card padding="md">
          <p className="ds-overline mb-4">Variants</p>
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>

          <p className="ds-overline mb-4">Sizes</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </Card>
      </div>

      {/* BADGES */}
      <div className="mb-20">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">Badges</h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          Status pills usando o par <code>intent.subtle</code> + <code>intent.onSubtle</code>.
        </p>
        <Card padding="md">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-[var(--ds-theme-intent-primary-subtle)] text-[color:var(--ds-theme-intent-primary-on-subtle)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
              Primary
            </Badge>
            <Badge className="bg-[var(--ds-theme-intent-accent-subtle)] text-[color:var(--ds-theme-intent-accent-on-subtle)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
              Accent
            </Badge>
            <Badge intent="success">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
              Active
            </Badge>
            <Badge intent="warning">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
              Pending
            </Badge>
            <Badge intent="danger">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
              Failed
            </Badge>
            <Badge intent="info">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
              Info
            </Badge>
            <Badge className="bg-[var(--ds-theme-intent-blush-subtle)] text-[color:var(--ds-theme-intent-blush-on-subtle)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
              New
            </Badge>
          </div>
        </Card>
      </div>

      {/* INPUTS */}
      <div className="mb-20">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">Inputs</h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          Tab pelo campo abaixo pra ver o focus ring atravessando todos os estados.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card padding="md">
            <p className="text-[length:var(--ds-font-size-sm)] font-medium text-[color:var(--ds-theme-content-strong)] mb-2">Email</p>
            <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </Card>
          <Card padding="md">
            <p className="text-[length:var(--ds-font-size-sm)] font-medium text-[color:var(--ds-theme-content-strong)] mb-2">Search</p>
            <Input type="search" placeholder="Search anything…" value={search} onChange={e => setSearch(e.target.value)} />
          </Card>
        </div>
      </div>

      {/* RADIUS / SPACING / SHADOW */}
      <div className="mb-20">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">Radius · Spacing · Shadow</h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          As três escalas mais reusadas. Mudar o raio em white-label = um override de tokens.
        </p>

        <p className="ds-overline mb-4">Radius</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4 mb-8">
          {[
            { name: 'sm', val: '8px', radius: 'var(--ds-radius-sm)' },
            { name: 'md', val: '12px', radius: 'var(--ds-radius-md)' },
            { name: 'lg', val: '16px', radius: 'var(--ds-radius-lg)' },
            { name: 'xl', val: '20px', radius: 'var(--ds-radius-xl)' },
            { name: '2xl', val: '24px', radius: 'var(--ds-radius-2xl)' },
            { name: '3xl', val: '32px', radius: 'var(--ds-radius-3xl)' },
            { name: 'pill', val: '9999px', radius: 'var(--ds-radius-pill)' },
          ].map(r => (
            <div key={r.name} className="flex flex-col gap-3 p-4 bg-[var(--ds-theme-surface-default)] border border-[var(--ds-theme-border-subtle)] rounded-[var(--ds-radius-lg)]">
              <div className="w-full h-[60px] bg-[var(--ds-theme-intent-accent-subtle)] border border-[var(--ds-theme-intent-accent-border)]" style={{ borderRadius: r.radius }} />
              <div className="flex flex-col text-left">
                <b className="text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-strong)]">{r.name}</b>
                <code className="font-[family:var(--ds-font-family-mono)] text-[10px] text-[color:var(--ds-theme-content-muted)]">{r.val}</code>
              </div>
            </div>
          ))}
        </div>

        <p className="ds-overline mb-4">Spacing</p>
        <div className="space-y-4 mb-8 bg-[var(--ds-theme-surface-default)] border border-[var(--ds-theme-border-subtle)] rounded-[var(--ds-radius-lg)] p-6">
          {[
            { name: '1', val: '4px', space: 'var(--ds-spacing-1)' },
            { name: '2', val: '8px', space: 'var(--ds-spacing-2)' },
            { name: '3', val: '12px', space: 'var(--ds-spacing-3)' },
            { name: '4', val: '16px', space: 'var(--ds-spacing-4)' },
            { name: '5', val: '20px', space: 'var(--ds-spacing-5)' },
            { name: '6', val: '24px', space: 'var(--ds-spacing-6)' },
            { name: '8', val: '32px', space: 'var(--ds-spacing-8)' },
            { name: '10', val: '40px', space: 'var(--ds-spacing-10)' },
            { name: '12', val: '48px', space: 'var(--ds-spacing-12)' },
            { name: '16', val: '64px', space: 'var(--ds-spacing-16)' },
          ].map(sp => (
            <div key={sp.name} className="flex items-center gap-4 text-[length:var(--ds-font-size-sm)]">
              <div className="w-24 text-left shrink-0">
                <b className="text-[color:var(--ds-theme-content-strong)] font-semibold">spacing-{sp.name}</b>
                <span className="block text-[10px] text-[color:var(--ds-theme-content-muted)] font-[var(--ds-font-family-mono)]">{sp.val}</span>
              </div>
              <div className="flex-1 h-6 bg-[var(--ds-theme-surface-subdued)] rounded flex items-center overflow-hidden">
                <div className="h-full bg-[var(--ds-theme-intent-accent-fill)] animate-pulse" style={{ width: sp.space }} />
              </div>
            </div>
          ))}
        </div>

        <p className="ds-overline mb-4">Shadow (current theme)</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
          {[
            { name: 'xs', shadow: 'var(--ds-theme-shadow-xs)' },
            { name: 'sm', shadow: 'var(--ds-theme-shadow-sm)' },
            { name: 'md', shadow: 'var(--ds-theme-shadow-md)' },
            { name: 'lg', shadow: 'var(--ds-theme-shadow-lg)' },
            { name: 'xl', shadow: 'var(--ds-theme-shadow-xl)' },
            { name: '2xl', shadow: 'var(--ds-theme-shadow-2xl)' },
          ].map(s => (
            <div key={s.name} className="flex flex-col gap-3 p-4 bg-[var(--ds-theme-surface-raised)] border border-transparent rounded-[var(--ds-radius-lg)]" style={{ boxShadow: 'none' }}>
              <div className="w-full h-[60px] rounded-[var(--ds-radius-lg)] bg-[var(--ds-theme-surface-raised)] border border-[var(--ds-theme-border-subtle)]" style={{ boxShadow: s.shadow }} />
              <div className="flex flex-col text-left">
                <b className="text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-strong)]">{s.name}</b>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GRADIENTS */}
      <div className="mb-20">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">Gradients</h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          Atmosfera, não preenchimento. Use em heros, cards de marketplace, ou backgrounds de seção.
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {[
            { name: 'auroraSoft', grad: 'var(--ds-theme-gradient-aurora-soft)' },
            { name: 'lavenderMist', grad: 'var(--ds-theme-gradient-lavender-mist)' },
            { name: 'blushSky', grad: 'var(--ds-theme-gradient-blush-sky)' },
            { name: 'sunsetSubtle', grad: 'var(--ds-theme-gradient-sunset-subtle)' },
            { name: 'mintLight', grad: 'var(--ds-theme-gradient-mint-light)' },
            { name: 'neutralRise', grad: 'var(--ds-theme-gradient-neutral-rise)' },
          ].map(g => (
            <div
              key={g.name}
              className="h-[140px] rounded-[var(--ds-radius-2xl)] p-4 flex flex-col justify-end text-left text-[length:var(--ds-font-size-sm)] font-semibold border border-[var(--ds-theme-border-subtle)]"
              style={{ background: g.grad, color: 'var(--ds-theme-content-strong)' }}
            >
              {g.name}
            </div>
          ))}
        </div>
      </div>

      {/* GLASS SURFACES */}
      <div className="mb-20">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">Glass surfaces</h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          Backdrop-filter + glass tint + glass border. O hero do app, calls em vídeo, controles flutuantes — tudo deste mix.
        </p>
        <div className="p-12 rounded-[var(--ds-radius-3xl)] border border-[var(--ds-theme-border-subtle)]" style={{ background: 'var(--ds-theme-gradient-aurora-soft)' }}>
          <div className="ds-glass p-6 rounded-[var(--ds-radius-2xl)] border shadow-[var(--ds-theme-shadow-lg)]">
            <p className="ds-overline">Floating panel</p>
            <h3 className="text-[length:var(--ds-font-size-2xl)] font-semibold text-[color:var(--ds-theme-content-strong)] mt-1 mb-2">Crystal clear</h3>
            <p className="text-[length:var(--ds-font-size-md)] leading-[var(--ds-font-line-height-normal)] text-[color:var(--ds-theme-content-default)]">
              A 1px inner border + soft tint reads as glass on every theme. Blur is tokenized too.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <Button variant="primary">Continue</Button>
              <Button variant="ghost">Skip</Button>
            </div>
          </div>
        </div>
      </div>

      {/* CHAT BUBBLES */}
      <div className="mb-20">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">Chat bubbles</h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          Componente de mensagem com par <code>bgSent / bgReceived</code>. Cobre messaging, AI chat e suporte.
        </p>
        <Card padding="md">
          <div className="flex flex-col gap-3 max-w-[480px]">
            <Message author="received">Olá! Tudo pronto para a reunião?</Message>
            <Message author="sent">Sim — vou enviar o link em 1 min.</Message>
            <Message author="sent">Link da call: aurora.app/meet/x9k2</Message>
            <Message author="received">Perfeito 🙌</Message>
          </div>
        </Card>
      </div>

      {/* NAVIGATION */}
      <div className="mb-20">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">Navigation</h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          Sidebar pattern dos apps de produtividade.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 bg-[var(--ds-theme-surface-default)] border border-[var(--ds-theme-border-subtle)] rounded-[var(--ds-radius-2xl)] p-4 overflow-hidden text-left">
          <div className="flex flex-col gap-1">
            <NavItem as="button" active>Dashboard</NavItem>
            <NavItem as="button">Messages</NavItem>
            <NavItem as="button">Calendar</NavItem>
            <NavItem as="button">Documents</NavItem>
            <NavItem as="button">Marketplace</NavItem>
            <NavItem as="button">Settings</NavItem>
          </div>
          <div className="p-6">
            <p className="ds-overline">Workspace</p>
            <h3 className="text-[length:var(--ds-font-size-2xl)] font-semibold text-[color:var(--ds-theme-content-strong)] mt-1 mb-4">Today's overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card padding="md" interactive className="text-left">
                <p className="text-[length:var(--ds-font-size-xs)] font-medium text-[color:var(--ds-theme-content-muted)] uppercase tracking-wider">Revenue</p>
                <p className="text-[length:var(--ds-font-size-4xl)] font-semibold text-[color:var(--ds-theme-content-strong)] mt-2">$28.4k</p>
                <Badge intent="success" className="mt-2">+12%</Badge>
              </Card>
              <Card padding="md" interactive className="text-left">
                <p className="text-[length:var(--ds-font-size-xs)] font-medium text-[color:var(--ds-theme-content-muted)] uppercase tracking-wider">Active users</p>
                <p className="text-[length:var(--ds-font-size-4xl)] font-semibold text-[color:var(--ds-theme-content-strong)] mt-2">1,284</p>
                <Badge intent="info" className="mt-2">live</Badge>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* FOCUS */}
      <div>
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">Focus & accessibility</h2>
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          Foco vem do token <code>focusRing</code>. Aplica em todo componente interativo — nada de focus por componente.
        </p>
        <button
          onClick={() => setSimulatedFocus(!simulatedFocus)}
          className={`focus-demo ${simulatedFocus ? 'simulated-focus' : ''}`}
        >
          {simulatedFocus ? 'Focus simulated! Click to reset' : 'Click to simulate focus / Tab here'}
        </button>
      </div>
    </section>
  );
}
