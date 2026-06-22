import { useState } from 'react';
import { Toggle, Label } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function ToggleSection() {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underlined, setUnderlined] = useState(true);
  const [muted, setMuted] = useState(false);

  return (
    <SectionWrapper
      id="toggle"
      title="Toggle"
      overline="Component"
      description="A two-state button that can be active (pressed) or inactive, built using Radix Toggle primitives."
    >
      <Subsection title="Variants" stack>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[color:var(--ds-theme-content-muted)] font-medium">Default (Pressed/Unpressed)</span>
            <div className="flex gap-2">
              <Toggle pressed={bold} onPressedChange={setBold} aria-label="Toggle bold">
                <span className="font-bold text-sm">B</span>
              </Toggle>
              <Toggle pressed={italic} onPressedChange={setItalic} aria-label="Toggle italic">
                <span className="italic font-serif text-sm">I</span>
              </Toggle>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-[color:var(--ds-theme-content-muted)] font-medium">Outline Variant</span>
            <div className="flex gap-2">
              <Toggle
                variant="outline"
                pressed={underlined}
                onPressedChange={setUnderlined}
                aria-label="Toggle underline"
              >
                <span className="underline text-sm font-semibold">U</span>
              </Toggle>
            </div>
          </div>
        </div>
      </Subsection>

      <Subsection title="Sizes" stack>
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-2 items-center">
            <span className="text-xs text-[color:var(--ds-theme-content-muted)]">Small</span>
            <Toggle size="sm" aria-label="Small toggle">
              <span className="text-xs">sm</span>
            </Toggle>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <span className="text-xs text-[color:var(--ds-theme-content-muted)]">Medium</span>
            <Toggle size="md" aria-label="Medium toggle">
              <span className="text-sm">md</span>
            </Toggle>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <span className="text-xs text-[color:var(--ds-theme-content-muted)]">Large</span>
            <Toggle size="lg" aria-label="Large toggle">
              <span className="text-base font-semibold">lg</span>
            </Toggle>
          </div>
        </div>
      </Subsection>

      <Subsection title="Disabled State" stack>
        <div className="flex gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[color:var(--ds-theme-content-muted)]">Disabled Unpressed</span>
            <Toggle disabled aria-label="Disabled unpressed toggle">
              <span className="text-sm">Off</span>
            </Toggle>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[color:var(--ds-theme-content-muted)]">Disabled Pressed</span>
            <Toggle disabled defaultPressed aria-label="Disabled pressed toggle">
              <span className="text-sm">On</span>
            </Toggle>
          </div>
        </div>
      </Subsection>

      <Subsection title="Interactive Composition" stack>
        <div className="flex flex-col gap-4 w-full max-w-sm p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label className="font-semibold">Mute notifications</Label>
              <span className="text-xs text-[color:var(--ds-theme-content-muted)]">
                Silence alerts for the next hour.
              </span>
            </div>
            <Toggle
              variant="outline"
              pressed={muted}
              onPressedChange={setMuted}
              aria-label="Toggle notifications mute"
              className="w-10 h-10 p-0 flex items-center justify-center"
            >
              {muted ? (
                <span className="text-base">🔕</span>
              ) : (
                <span className="text-base">🔔</span>
              )}
            </Toggle>
          </div>
          <div className="text-xs font-mono text-[color:var(--ds-theme-content-muted)]">
            Muted state: {muted ? 'TRUE' : 'FALSE'}
          </div>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
