import { NavItem, NavGroup } from '@plataforma/design-system';
import type { SectionDef } from '../sections';

interface SidebarProps {
  sections: SectionDef[];
  activeSection: string;
}

const categoryLabel: Record<string, string> = {
  atom: 'Atoms',
  molecule: 'Molecules',
  organism: 'Organisms',
};

export default function Sidebar({ sections, activeSection }: SidebarProps) {
  const grouped = sections.reduce<Record<string, SectionDef[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav
      aria-label="Components"
      className="sticky top-16 h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto py-8 pr-4 border-r border-[color:var(--ds-theme-border-subtle)]"
    >
      <div className="mb-6">
        <NavGroup label="General">
          <NavItem
            as="button"
            active={activeSection === 'overview'}
            onClick={() => scrollTo('overview')}
          >
            Overview
          </NavItem>
        </NavGroup>
      </div>

      {(['atom', 'molecule', 'organism'] as const).map(cat => {
        const items = grouped[cat];
        if (!items?.length) return null;
        return (
          <div key={cat} className="mb-6">
            <NavGroup label={categoryLabel[cat]}>
              {items.map(({ id, label }) => (
                <NavItem
                  key={id}
                  as="button"
                  active={activeSection === id}
                  onClick={() => scrollTo(id)}
                >
                  {label}
                </NavItem>
              ))}
            </NavGroup>
          </div>
        );
      })}
    </nav>
  );
}
