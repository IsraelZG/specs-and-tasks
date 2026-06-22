import { useState } from 'react';
import { Alert, Button } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

const intents = ['info', 'success', 'warning', 'danger'] as const;
type Intent = typeof intents[number];

const intentTitles: Record<Intent, string> = {
  info: 'Session expiring',
  success: 'Payment confirmed',
  warning: 'Unsaved changes',
  danger: 'Connection failed',
};

const intentMessages: Record<Intent, string> = {
  info: 'Your session will expire in 30 minutes. Save your work to avoid losing progress.',
  success: 'Payment of $249.00 was processed successfully. Receipt sent to your email.',
  warning: 'You have unsaved changes. Navigating away will discard all edits.',
  danger: 'Unable to connect to the server. Check your connection and try again.',
};

export default function AlertSection() {
  const [dismissed, setDismissed] = useState<Set<Intent>>(new Set());

  const dismiss = (intent: Intent) =>
    setDismissed(prev => new Set([...prev, intent]));

  const restore = () => setDismissed(new Set());

  return (
    <SectionWrapper
      id="alert"
      title="Alert"
      overline="Component"
      description="Inline persistent feedback. Does not auto-dismiss. Use Toast for transient messages."
    >
      <Subsection title="With title and dismiss" stack>
        <div className="flex flex-col gap-3 max-w-lg w-full">
          {intents.map(intent =>
            !dismissed.has(intent) ? (
              <Alert
                key={intent}
                intent={intent}
                title={intentTitles[intent]}
                dismissible
                onDismiss={() => dismiss(intent)}
              >
                {intentMessages[intent]}
              </Alert>
            ) : null
          )}
          {dismissed.size > 0 && (
            <Button variant="ghost" size="sm" onClick={restore}>
              Restore all alerts
            </Button>
          )}
        </div>
      </Subsection>

      <Subsection title="Without title" stack>
        <div className="flex flex-col gap-3 max-w-lg w-full">
          {intents.map(intent => (
            <Alert key={intent} intent={intent}>
              {intentMessages[intent]}
            </Alert>
          ))}
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
