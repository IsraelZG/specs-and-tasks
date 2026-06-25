import { Badge } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

const intents = ['neutral', 'success', 'warning', 'danger', 'info'] as const;

const statusRows = [
  { label: 'Production deploy', intent: 'success', text: 'Live' },
  { label: 'Staging build', intent: 'warning', text: 'Building' },
  { label: 'Auth service', intent: 'danger', text: 'Down' },
  { label: 'CDN cache', intent: 'info', text: 'Syncing' },
  { label: 'Beta feature', intent: 'neutral', text: 'Draft' },
] as const;

export default function BadgeSection() {
  return (
    <SectionWrapper
      id="badge"
      title="Badge"
      overline="Component"
      description="Compact status or category label. Display-only — wrap in a button if action is needed."
    >
      <Subsection title="Intents — size md">
        {intents.map(intent => (
          <Badge key={intent} intent={intent}>
            {intent}
          </Badge>
        ))}
      </Subsection>

      <Subsection title="Intents — size sm">
        {intents.map(intent => (
          <Badge key={intent} intent={intent} size="sm">
            {intent}
          </Badge>
        ))}
      </Subsection>

      <Subsection title="With dot indicator">
        {intents.map(intent => (
          <Badge key={intent} intent={intent}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
            {intent}
          </Badge>
        ))}
      </Subsection>

      <Subsection title="In context — service status" stack>
        <div className="flex flex-col w-full max-w-sm">
          {statusRows.map(({ label, intent, text }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2.5 border-b last:border-b-0 border-[color:var(--ds-theme-border-subtle)]"
            >
              <span className="text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-default)]">
                {label}
              </span>
              <Badge intent={intent}>{text}</Badge>
            </div>
          ))}
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
