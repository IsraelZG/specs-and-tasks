import { useState } from 'react';
import { Toast, Button } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

const intents = ['info', 'success', 'warning', 'danger'] as const;
const placements = ['top-right', 'top-center', 'bottom-right', 'bottom-center'] as const;

type Intent = typeof intents[number];
type Placement = typeof placements[number];

const toastMessages: Record<Intent, string> = {
  info: 'Update available. Refresh to apply the latest changes.',
  success: 'File uploaded successfully. Processing in the background.',
  warning: 'Storage at 90% capacity. Consider removing unused files.',
  danger: 'Connection lost. Retrying in 5 seconds…',
};

interface ActiveToast {
  intent: Intent;
  placement: Placement;
  key: number;
  persistent: boolean;
}

export default function ToastSection() {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const [placement, setPlacement] = useState<Placement>('top-right');
  const [counter, setCounter] = useState(0);

  const show = (intent: Intent, persistent = false) => {
    setCounter(c => c + 1);
    setToast({ intent, placement, key: counter + 1, persistent });
  };

  return (
    <SectionWrapper
      id="toast"
      title="Toast"
      overline="Component"
      description="Transient notification that auto-dismisses in 5s. Timer pauses on hover/focus (WCAG 2.2.1)."
    >
      <Subsection title="Placement">
        <div className="flex flex-wrap gap-2">
          {placements.map(p => (
            <Button
              key={p}
              variant={placement === p ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setPlacement(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </Subsection>

      <Subsection title="Trigger by intent">
        {intents.map(intent => (
          <Button key={intent} variant="secondary" size="sm" onClick={() => show(intent)}>
            {intent[0].toUpperCase() + intent.slice(1)}
          </Button>
        ))}
      </Subsection>

      <Subsection title="Persistent — no auto-dismiss">
        <Button variant="ghost" size="sm" onClick={() => show('info', true)}>
          Show persistent toast
        </Button>
      </Subsection>

      {toast && (
        <Toast
          key={toast.key}
          intent={toast.intent}
          placement={toast.placement}
          duration={toast.persistent ? null : 5000}
          onDismiss={() => setToast(null)}
          showClose
        >
          {toastMessages[toast.intent]}
        </Toast>
      )}
    </SectionWrapper>
  );
}
