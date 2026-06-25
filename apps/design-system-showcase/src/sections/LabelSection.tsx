import { useState } from 'react';
import { Label, Input } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function LabelSection() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [workspace, setWorkspace] = useState('ws-12345');

  return (
    <SectionWrapper
      id="label"
      title="Label"
      overline="Component"
      description="Accessible text label associated with form controls, supporting required and disabled states."
    >
      <Subsection title="States">
        <div className="flex flex-col gap-4">
          <Label>Standard Label</Label>
          <Label required>Required Label</Label>
          <Label disabled>Disabled Label</Label>
          <Label disabled required>Disabled Required Label</Label>
        </div>
      </Subsection>

      <Subsection title="Form Field Composition" stack>
        <div className="flex flex-col gap-6 w-full max-w-sm">
          <div className="flex flex-col gap-2">
            <Label htmlFor="input-name" required>Full Name</Label>
            <Input
              id="input-name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="input-phone">Phone Number (Optional)</Label>
            <Input
              id="input-phone"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="input-disabled" disabled>Workspace ID (Read Only)</Label>
            <Input
              id="input-disabled"
              placeholder="ws-12345"
              disabled
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
            />
          </div>
        </div>
      </Subsection>

      <Subsection title="Custom Styles">
        <div className="flex flex-col gap-4">
          <Label className="text-[color:var(--ds-theme-intent-primary-fill)] uppercase tracking-wider text-[length:var(--ds-font-size-xs)]">
            Primary Accented Label
          </Label>
          <Label className="text-[color:var(--ds-theme-intent-success-fill)] font-[var(--ds-font-weight-bold)]">
            Success Bold Label
          </Label>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
