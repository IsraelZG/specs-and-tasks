import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem, Label } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function ToggleGroupSection() {
  const [alignment, setAlignment] = useState('left');
  const [formats, setFormats] = useState<string[]>(['bold']);
  const [sizeVal, setSizeVal] = useState('md');

  return (
    <SectionWrapper
      id="togglegroup"
      title="Toggle Group"
      overline="Component"
      description="A set of two-state buttons that can be toggled on or off, functioning as single-select or multi-select options."
    >
      <Subsection title="Single Selection (Alignment Toolbar)" stack>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Label>Paragraph Alignment</Label>
          <div className="flex items-center gap-4">
            <ToggleGroup
              type="single"
              value={alignment}
              onValueChange={(val) => {
                if (val) setAlignment(val);
              }}
              aria-label="Text alignment"
            >
              <ToggleGroupItem value="left" aria-label="Align left">
                <span className="text-sm">Left</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Align center">
                <span className="text-sm">Center</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Align right">
                <span className="text-sm">Right</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="justify" aria-label="Align justify">
                <span className="text-sm">Justify</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <span className="text-xs font-mono text-[color:var(--ds-theme-content-muted)]">
            Selected value: {alignment}
          </span>
        </div>
      </Subsection>

      <Subsection title="Multiple Selection (Text Formatting)" stack>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Label>Font Styles</Label>
          <div className="flex items-center gap-4">
            <ToggleGroup
              type="multiple"
              value={formats}
              onValueChange={setFormats}
              aria-label="Text formatting"
            >
              <ToggleGroupItem value="bold" aria-label="Toggle bold">
                <span className="font-bold text-sm">B</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Toggle italic">
                <span className="italic font-serif text-sm">I</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Toggle underline">
                <span className="underline text-sm">U</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <span className="text-xs font-mono text-[color:var(--ds-theme-content-muted)]">
            Selected values: {JSON.stringify(formats)}
          </span>
        </div>
      </Subsection>

      <Subsection title="Outline Variant & Sizes" stack>
        <div className="flex flex-col gap-6 w-full max-w-sm">
          <div className="flex flex-col gap-2">
            <Label>Outline Variant (Single Select)</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={sizeVal}
              onValueChange={(val) => {
                if (val) setSizeVal(val);
              }}
              aria-label="Component size selection"
            >
              <ToggleGroupItem value="sm" aria-label="Small size">Small</ToggleGroupItem>
              <ToggleGroupItem value="md" aria-label="Medium size">Medium</ToggleGroupItem>
              <ToggleGroupItem value="lg" aria-label="Large size">Large</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </Subsection>

      <Subsection title="Disabled Group" stack>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Label disabled>Read-only Formatting</Label>
          <ToggleGroup type="multiple" disabled defaultValue={['bold', 'underline']}>
            <ToggleGroupItem value="bold" aria-label="Toggle bold">
              <span className="font-bold text-sm">B</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic">
              <span className="italic font-serif text-sm">I</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Toggle underline">
              <span className="underline text-sm">U</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
