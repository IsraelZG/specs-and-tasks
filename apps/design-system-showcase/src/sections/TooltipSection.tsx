import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Button } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function TooltipSection() {
  return (
    <SectionWrapper
      id="tooltip"
      title="Tooltip"
      overline="Component"
      description="A brief description bubble that appears on mouse hover or keyboard focus."
    >
      <Subsection title="Interactive Tooltip Hints" stack>
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a helper tooltip text!</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center w-8 h-8 rounded-full border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)] hover:bg-[color:var(--ds-theme-surface-default)] transition-colors text-sm">
                  ℹ️
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[150px] text-center">Info details about layout settings.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
