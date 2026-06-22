import { useState } from 'react';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function SelectSection() {
  const [value, setValue] = useState('light');

  return (
    <SectionWrapper
      id="select"
      title="Select"
      overline="Component"
      description="An styled select dropdown component providing user options list picker inside forms."
    >
      <Subsection title="Theme Selection Form" stack>
        <div className="flex items-center gap-4">
          <div className="w-full max-w-xs">
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Preferences</SelectLabel>
                  <SelectSeparator />
                  <SelectItem value="light">☀️ Light Theme</SelectItem>
                  <SelectItem value="dark">🌙 Dark Theme</SelectItem>
                  <SelectItem value="system">🖥️ System Default</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs font-mono text-[color:var(--ds-theme-content-muted)] bg-[color:var(--ds-theme-surface-subdued)] p-3 rounded-lg border border-[color:var(--ds-theme-border-subtle)]">
            Active: {value}
          </div>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
