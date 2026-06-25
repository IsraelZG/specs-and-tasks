import { Separator } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function SeparatorSection() {
  return (
    <SectionWrapper
      id="separator"
      title="Separator"
      overline="Component"
      description="A visual or semantic dividing line to group or separate content sections."
    >
      <Subsection title="Horizontal Separator" stack>
        <div className="w-full max-w-md p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)]">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold leading-none">Design System UI</h4>
            <p className="text-xs text-[color:var(--ds-theme-content-muted)]">
              An open-source UI component library built for white-label products.
            </p>
          </div>
          <Separator className="my-4" />
          <div className="flex h-5 items-center space-x-4 text-xs font-medium">
            <div>Documentation</div>
            <Separator orientation="vertical" />
            <div>Source Code</div>
            <Separator orientation="vertical" />
            <div>Releases</div>
          </div>
        </div>
      </Subsection>

      <Subsection title="Vertical Divider (Inline Navigation)" stack>
        <div className="w-full max-w-sm p-3 rounded-lg border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)]">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Israel Z.G.</span>
            <div className="flex h-4 items-center space-x-2">
              <a href="#" className="hover:underline text-xs">Profile</a>
              <Separator orientation="vertical" />
              <a href="#" className="hover:underline text-xs">Billing</a>
              <Separator orientation="vertical" />
              <a href="#" className="hover:underline text-xs">Settings</a>
            </div>
          </div>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
