import { useState } from 'react';
import { Checkbox, Card, FormField } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function CheckboxSection() {
  const [checked, setChecked] = useState(false);
  const [items, setItems] = useState({ a: false, b: true, c: false });

  const allChecked = Object.values(items).every(Boolean);
  const someChecked = Object.values(items).some(Boolean) && !allChecked;

  const toggleAll = (v: boolean) => setItems({ a: v, b: v, c: v });
  const toggleItem = (k: keyof typeof items) => (v: boolean) =>
    setItems(prev => ({ ...prev, [k]: v }));

  return (
    <SectionWrapper
      id="checkbox"
      title="Checkbox"
      overline="Component"
      description="Binary or indeterminate selection. onChange receives a boolean directly."
    >
      <Subsection title="In form context" stack>
        <Card padding="md" className="max-w-sm w-full">
          <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[color:var(--ds-theme-content-strong)] mb-4">
            Email notifications
          </p>
          <div className="flex flex-col gap-3">
            <FormField label="New comments" helpText="Get notified when someone replies.">
              <Checkbox checked={checked} onChange={setChecked} />
            </FormField>
            <FormField label="Critical alerts" helpText="Always enabled — required for security.">
              <Checkbox checked onChange={() => {}} disabled />
            </FormField>
            <FormField label="Marketing emails" helpText="Requires the Pro plan.">
              <Checkbox checked={false} onChange={() => {}} disabled />
            </FormField>
          </div>
        </Card>
      </Subsection>

      <Subsection title="Select all — indeterminate" stack>
        <div className="flex flex-col gap-2">
          <Checkbox
            indeterminate={someChecked}
            checked={allChecked}
            onChange={toggleAll}
          >
            Select all repositories
          </Checkbox>
          <div className="ml-6 flex flex-col gap-2">
            <Checkbox checked={items.a} onChange={toggleItem('a')}>design-system</Checkbox>
            <Checkbox checked={items.b} onChange={toggleItem('b')}>showcase-app</Checkbox>
            <Checkbox checked={items.c} onChange={toggleItem('c')}>token-builder</Checkbox>
          </div>
        </div>
      </Subsection>

      <Subsection title="Sizes">
        <Checkbox size="sm" checked={false} onChange={() => {}}>Small — for dense tables or sidebars</Checkbox>
        <Checkbox size="md" checked={false} onChange={() => {}}>Medium — default for forms</Checkbox>
      </Subsection>
    </SectionWrapper>
  );
}
