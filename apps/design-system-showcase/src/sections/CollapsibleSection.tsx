import { useState } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent, Button } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function CollapsibleSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SectionWrapper
      id="collapsible"
      title="Collapsible"
      overline="Component"
      description="An interactive component that allows developers to expand or collapse standalone blocks of layout content dynamically."
    >
      <Subsection title="Simple Toggle Content" stack>
        <div className="w-full max-w-md p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] space-y-2">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">@john_doe starred 3 repositories</span>
              <CollapsibleTrigger asChild>
                <Button variant="secondary" size="sm">
                  {isOpen ? 'Close details' : 'Show details'}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <div className="mt-2 text-sm text-[color:var(--ds-theme-content-muted)] bg-[color:var(--ds-theme-surface-subdued)] p-3 rounded-lg border border-[color:var(--ds-theme-border-subtle)]">
              repo: <code className="font-mono text-xs text-[color:var(--ds-theme-content-default)]">design-system</code>
            </div>

            <CollapsibleContent className="space-y-2 mt-2">
              <div className="text-sm text-[color:var(--ds-theme-content-muted)] bg-[color:var(--ds-theme-surface-subdued)] p-3 rounded-lg border border-[color:var(--ds-theme-border-subtle)]">
                repo: <code className="font-mono text-xs text-[color:var(--ds-theme-content-default)]">showcase-app</code>
              </div>
              <div className="text-sm text-[color:var(--ds-theme-content-muted)] bg-[color:var(--ds-theme-surface-subdued)] p-3 rounded-lg border border-[color:var(--ds-theme-border-subtle)]">
                repo: <code className="font-mono text-xs text-[color:var(--ds-theme-content-default)]">theme-compiler</code>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
