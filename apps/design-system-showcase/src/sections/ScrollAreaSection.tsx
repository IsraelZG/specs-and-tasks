import { ScrollArea, Separator } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function ScrollAreaSection() {
  const tags = Array.from({ length: 30 }).map((_, i) => `Tag v${i + 1}.0.0`);

  return (
    <SectionWrapper
      id="scrollarea"
      title="Scroll Area"
      overline="Component"
      description="Augments scrollable layout panels with consistent, cross-platform scrollbar aesthetics."
    >
      <Subsection title="Custom Scrollbar List" stack>
        <div className="w-full max-w-xs">
          <ScrollArea className="h-64 w-60 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)]">
            <div className="p-4">
              <h4 className="mb-4 text-sm font-semibold leading-none text-[color:var(--ds-theme-content-default)]">Tags Index</h4>
              {tags.map((tag, idx) => (
                <div key={tag}>
                  <div className="text-sm py-2 text-[color:var(--ds-theme-content-default)]">{tag}</div>
                  {idx < tags.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
