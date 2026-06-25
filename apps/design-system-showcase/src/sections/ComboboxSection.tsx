import * as React from 'react';
import { Combobox } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

const frameworks = [
  { value: 'nextjs', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
];

export default function ComboboxSection() {
  const [value, setValue] = React.useState('');

  return (
    <SectionWrapper
      id="combobox"
      title="Combobox"
      overline="Component"
      description="An autocomplete selector list offering filtering queries and value matches."
    >
      <Subsection title="Interactive Demo">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Combobox
            options={frameworks}
            value={value}
            onValueChange={setValue}
            placeholder="Select framework..."
          />
          <div className="text-xs text-[color:var(--ds-theme-content-muted)]">
            Active Selection: <span className="font-semibold text-[color:var(--ds-theme-content-default)]">{value || 'None'}</span>
          </div>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
