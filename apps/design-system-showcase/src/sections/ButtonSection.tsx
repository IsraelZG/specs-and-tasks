import { useState } from 'react';
import { Button, Card } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

const sizes = ['sm', 'md', 'lg'] as const;

export default function ButtonSection() {
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <SectionWrapper
      id="button"
      title="Button"
      overline="Component"
      description="Triggers an action. Keep at most one primary variant per section."
    >
      <Subsection title="Primary — main call to action">
        <Button size="sm">Get started</Button>
        <Button size="md">Save changes</Button>
        <Button size="lg">Continue</Button>
      </Subsection>

      <Subsection title="Secondary — supporting actions">
        <Button variant="secondary" size="sm">Cancel</Button>
        <Button variant="secondary" size="md">View details</Button>
        <Button variant="secondary" size="lg">Back</Button>
      </Subsection>

      <Subsection title="Ghost — tertiary / low emphasis">
        <Button variant="ghost" size="sm">Skip</Button>
        <Button variant="ghost" size="md">Learn more</Button>
        <Button variant="ghost" size="lg">More options</Button>
      </Subsection>

      <Subsection title="Danger — destructive actions">
        <Button variant="danger" size="sm">Remove</Button>
        <Button variant="danger" size="md">Delete account</Button>
        <Button variant="danger" size="lg">Revoke access</Button>
      </Subsection>

      <Subsection title="States">
        <Button loading={loading} onClick={simulateLoading}>
          {loading ? 'Saving…' : 'Submit form'}
        </Button>
        <Button disabled>Primary disabled</Button>
        <Button variant="secondary" disabled>Secondary disabled</Button>
        <Button variant="ghost" disabled>Ghost disabled</Button>
      </Subsection>

      <Subsection title="Full width" stack>
        <Card padding="sm" className="max-w-sm w-full">
          <p className="text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] mb-3">
            Checkout form footer
          </p>
          <Button fullWidth>Complete purchase</Button>
        </Card>
      </Subsection>
    </SectionWrapper>
  );
}
