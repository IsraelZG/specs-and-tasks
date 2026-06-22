import { useState } from 'react';
import { RadioGroup, RadioGroupItem, Label, FormField } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function RadioGroupSection() {
  const [flavor, setFlavor] = useState('chocolate');
  const [size, setSize] = useState('cozy');
  const [plan, setPlan] = useState('monthly');

  return (
    <SectionWrapper
      id="radiogroup"
      title="Radio Group"
      overline="Component"
      description="A set of checkable circular buttons where only one option can be selected at a time, utilizing Radix RadioGroup."
    >
      <Subsection title="Standard Group (Vertical)" stack>
        <div className="w-full max-w-sm">
          <RadioGroup value={flavor} onValueChange={setFlavor}>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="vanilla" id="flavor-vanilla" />
              <Label htmlFor="flavor-vanilla" className="cursor-pointer">Vanilla</Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="chocolate" id="flavor-chocolate" />
              <Label htmlFor="flavor-chocolate" className="cursor-pointer">Chocolate</Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="strawberry" id="flavor-strawberry" />
              <Label htmlFor="flavor-strawberry" className="cursor-pointer">Strawberry</Label>
            </div>
          </RadioGroup>
        </div>
      </Subsection>

      <Subsection title="Horizontal Row" stack>
        <div className="w-full max-w-sm">
          <RadioGroup value={size} onValueChange={setSize} className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="compact" id="size-compact" />
              <Label htmlFor="size-compact" className="cursor-pointer">Compact</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="cozy" id="size-cozy" />
              <Label htmlFor="size-cozy" className="cursor-pointer">Cozy</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="large" id="size-large" />
              <Label htmlFor="size-large" className="cursor-pointer">Large</Label>
            </div>
          </RadioGroup>
        </div>
      </Subsection>

      <Subsection title="Disabled Options" stack>
        <div className="w-full max-w-sm">
          <RadioGroup defaultValue="active" disabled>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="active" id="dis-active" />
              <Label htmlFor="dis-active" disabled>Active Plan (Selected)</Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="inactive" id="dis-inactive" />
              <Label htmlFor="dis-inactive" disabled>Inactive Option</Label>
            </div>
          </RadioGroup>
        </div>
      </Subsection>

      <Subsection title="Form Field Integration (Billing Plans)" stack>
        <div className="w-full max-w-sm">
          <FormField
            label="Billing Cycle"
            helpText="Choose how often you would like to be billed."
          >
            <RadioGroup value={plan} onValueChange={setPlan} className="gap-4 mt-2">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)]">
                <RadioGroupItem value="monthly" id="plan-monthly" className="mt-0.5" />
                <div className="flex flex-col gap-1 cursor-pointer">
                  <Label htmlFor="plan-monthly" className="font-semibold cursor-pointer">Monthly Plan</Label>
                  <span className="text-xs text-[color:var(--ds-theme-content-muted)]">$15 / month, cancel anytime</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)]">
                <RadioGroupItem value="annual" id="plan-annual" className="mt-0.5" />
                <div className="flex flex-col gap-1 cursor-pointer">
                  <Label htmlFor="plan-annual" className="font-semibold cursor-pointer">Annual Plan (Save 20%)</Label>
                  <span className="text-xs text-[color:var(--ds-theme-content-muted)]">$120 / year ($10/month)</span>
                </div>
              </div>
            </RadioGroup>
          </FormField>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
