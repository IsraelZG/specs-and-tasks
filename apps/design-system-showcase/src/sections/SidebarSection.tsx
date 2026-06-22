import * as React from 'react';
import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function SidebarSection() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [activeItem, setActiveItem] = React.useState('dashboard');

  return (
    <SectionWrapper
      id="sidebar"
      title="Sidebar"
      overline="Component"
      description="A layout sidebar containing vertical menus, footers and collapsing states."
    >
      <Subsection title="Interactive Demo" stack>
        <div className="space-y-4 w-full">
          <Button onClick={() => setCollapsed((c) => !c)} className="cursor-pointer">
            Toggle Sidebar Collapse
          </Button>

          <div className="flex border border-[color:var(--ds-theme-border-subtle)] rounded-2xl overflow-hidden h-[400px] bg-[color:var(--ds-theme-surface-subdued)]/20 w-full">
            <Sidebar isCollapsed={collapsed}>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel isCollapsed={collapsed}>Overview</SidebarGroupLabel>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeItem === 'dashboard'}
                        isCollapsed={collapsed}
                        onClick={() => setActiveItem('dashboard')}
                      >
                        <span className="text-sm">📊</span>
                        {!collapsed && <span>Dashboard</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeItem === 'analytics'}
                        isCollapsed={collapsed}
                        onClick={() => setActiveItem('analytics')}
                      >
                        <span className="text-sm">📈</span>
                        {!collapsed && <span>Analytics</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup>
                  <SidebarGroupLabel isCollapsed={collapsed}>Settings</SidebarGroupLabel>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeItem === 'profile'}
                        isCollapsed={collapsed}
                        onClick={() => setActiveItem('profile')}
                      >
                        <span className="text-sm">👤</span>
                        {!collapsed && <span>Profile</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter>
                <div className="text-center text-[10px] text-[color:var(--ds-theme-content-muted)]">
                  {collapsed ? 'v1.0' : 'Dashboard v1.0.0'}
                </div>
              </SidebarFooter>
            </Sidebar>
            <div className="flex-1 p-6 text-sm text-[color:var(--ds-theme-content-muted)] bg-[color:var(--ds-theme-surface-default)]">
              Main content panel corresponding to: <span className="font-semibold text-[color:var(--ds-theme-content-default)] uppercase">{activeItem}</span>.
            </div>
          </div>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
