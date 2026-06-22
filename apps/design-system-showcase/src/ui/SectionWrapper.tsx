import type { ReactNode } from 'react';

interface SectionWrapperProps {
  id: string;
  title: string;
  overline?: string;
  description?: string;
  children: ReactNode;
}

export function SectionWrapper({ id, title, overline, description, children }: SectionWrapperProps) {
  return (
    <section
      id={id}
      className="pt-10 pb-20 border-b last:border-b-0 border-[color:var(--ds-theme-border-subtle)]"
    >
      {overline && <p className="ds-overline mb-3">{overline}</p>}
      <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] mb-1">
        {title}
      </h2>
      {description && (
        <p className="mb-8 text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)] max-w-[60ch]">
          {description}
        </p>
      )}
      <div className="space-y-8">{children}</div>
    </section>
  );
}

interface SubsectionProps {
  title: string;
  children: ReactNode;
  stack?: boolean;
}

export function Subsection({ title, children, stack = false }: SubsectionProps) {
  return (
    <div>
      <p className="ds-overline mb-3">{title}</p>
      <div className="ds-preview">
        <div className={stack ? 'flex flex-col gap-3' : 'flex flex-wrap items-start gap-3'}>
          {children}
        </div>
      </div>
    </div>
  );
}
