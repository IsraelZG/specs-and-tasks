import { NavItem, NavGroup } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M3 7.5L9 2.25L15 7.5V15H12V10.5H6V15H3V7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M3 12L7 8L11 11L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M4.1 4.1l1.06 1.06M12.84 12.84l1.06 1.06M4.1 13.9l1.06-1.06M12.84 5.16l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 14.5c0-2.5 2.24-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 5.5a2 2 0 0 1 0 4M16 14.5c0-2-1.5-3.5-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function SidebarContainer({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  return (
    <nav
      aria-label="Example sidebar"
      className={`flex flex-col gap-4 p-2 rounded-2xl border border-[color:var(--ds-theme-border-subtle)] bg-[var(--ds-theme-surface-default)] ${
        collapsed ? 'w-[var(--ds-component-navigation-sidebar-width-collapsed)]' : 'w-60'
      }`}
    >
      {children}
    </nav>
  );
}

function SidebarContainerDark({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  return (
    <nav
      aria-label="Example dark sidebar"
      className={`flex flex-col gap-4 p-2 rounded-2xl bg-[var(--ds-theme-surface-inverse)] ${
        collapsed ? 'w-[var(--ds-component-navigation-sidebar-width-collapsed)]' : 'w-60'
      }`}
    >
      {children}
    </nav>
  );
}

export default function NavItemSection() {
  return (
    <SectionWrapper
      id="navitem"
      title="NavItem"
      overline="Component"
      description="Single navigation row. active is exclusive per group — two active items in the same group is a bug."
    >
      <Subsection title="Light sidebar">
        <SidebarContainer>
          <NavGroup label="Main">
            <NavItem as="button" icon={<HomeIcon />} active>Dashboard</NavItem>
            <NavItem as="button" icon={<ChartIcon />}>Analytics</NavItem>
          </NavGroup>
          <NavGroup label="Admin">
            <NavItem as="button" icon={<UsersIcon />}>Users</NavItem>
            <NavItem as="button" icon={<SettingsIcon />} disabled>Settings</NavItem>
          </NavGroup>
        </SidebarContainer>
      </Subsection>

      <Subsection title="Dark sidebar (tone=inverse)">
        <SidebarContainerDark>
          <NavGroup label="Main">
            <NavItem as="button" icon={<HomeIcon />} tone="inverse" active>Dashboard</NavItem>
            <NavItem as="button" icon={<ChartIcon />} tone="inverse">Analytics</NavItem>
          </NavGroup>
          <NavGroup label="Admin">
            <NavItem as="button" icon={<UsersIcon />} tone="inverse">Users</NavItem>
            <NavItem as="button" icon={<SettingsIcon />} tone="inverse" disabled>Settings</NavItem>
          </NavGroup>
        </SidebarContainerDark>
      </Subsection>

      <Subsection title="Collapsed — icon only (aria-label required)">
        <SidebarContainer collapsed>
          <NavGroup>
            <NavItem as="button" icon={<HomeIcon />} collapsed active aria-label="Dashboard">Dashboard</NavItem>
            <NavItem as="button" icon={<ChartIcon />} collapsed aria-label="Analytics">Analytics</NavItem>
            <NavItem as="button" icon={<UsersIcon />} collapsed aria-label="Users">Users</NavItem>
            <NavItem as="button" icon={<SettingsIcon />} collapsed aria-label="Settings">Settings</NavItem>
          </NavGroup>
        </SidebarContainer>
        <SidebarContainerDark collapsed>
          <NavGroup>
            <NavItem as="button" icon={<HomeIcon />} collapsed tone="inverse" active aria-label="Dashboard">Dashboard</NavItem>
            <NavItem as="button" icon={<ChartIcon />} collapsed tone="inverse" aria-label="Analytics">Analytics</NavItem>
          </NavGroup>
        </SidebarContainerDark>
      </Subsection>

      <Subsection title="As link (as='a')">
        <SidebarContainer>
          <NavGroup>
            <NavItem as="a" href="#navitem" icon={<HomeIcon />} active>Home (link)</NavItem>
            <NavItem as="a" href="#navitem" icon={<ChartIcon />}>Analytics (link)</NavItem>
          </NavGroup>
        </SidebarContainer>
      </Subsection>
    </SectionWrapper>
  );
}
