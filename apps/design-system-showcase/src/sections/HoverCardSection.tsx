import { HoverCard, HoverCardTrigger, HoverCardContent, Avatar } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function HoverCardSection() {
  return (
    <SectionWrapper
      id="hovercard"
      title="Hover Card"
      overline="Component"
      description="Allows sighted users to preview content behind links on hover, preserving context."
    >
      <Subsection title="User Profile Preview" stack>
        <div className="flex items-center gap-2 p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] text-sm max-w-md">
          <span>Developed under project scope by</span>
          <HoverCard>
            <HoverCardTrigger asChild>
              <a
                href="https://github.com/google-deepmind"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold text-[color:var(--ds-theme-content-default)] hover:opacity-80 transition-opacity"
              >
                @antigravity
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="flex justify-between space-x-4">
                <Avatar
                  src="https://github.com/identicons/antigravity.png"
                  fallback="AG"
                  className="w-10 h-10 shrink-0"
                />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Antigravity AI</h4>
                  <p className="text-xs text-[color:var(--ds-theme-content-muted)]">
                    Advanced Agentic Coding agent developed by Google DeepMind team.
                  </p>
                  <div className="flex items-center pt-2">
                    <span className="text-xs text-[color:var(--ds-theme-content-muted)]">
                      📅 Joined May 2026
                    </span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          <span>and team members.</span>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
