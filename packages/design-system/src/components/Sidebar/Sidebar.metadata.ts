import { defineMetadata } from '../../metadata/schema.ts';

export const SidebarMetadata = defineMetadata({
  component: {
    name: 'Sidebar',
    category: 'organism',
    description: 'A layout sidebar containing vertical menus, footers and collapsing states.',
    type: 'container',
    path: 'src/components/Sidebar/Sidebar.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'admin-dashboard-sidebars',
      'navigation-collapsible-menus',
      'app-control-side-drawers',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'collapsible-sidebar',
        description: 'Exposes collapsing sidebar menu.',
        composition: `<Sidebar isCollapsed={collapsed}>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel isCollapsed={collapsed}>Nav</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton isActive isCollapsed={collapsed}>Home</SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>`,
      }
    ],
    antiPatterns: []
  },
  behavior: {
    states: [
      { name: 'collapsed', visual: 'Width shrinks down to 16rem/4rem with transitions.' }
    ],
    interactions: [
      'Triggers menu button actions.'
    ],
    responsive: 'Hides/collapses side elements on mobile width thresholds.'
  },
  props: {
    collapsible: { type: 'boolean', default: 'false', required: false, description: 'Allows collapsing sidebar width.' },
    isCollapsed: { type: 'boolean', default: 'false', required: false, description: 'Toggles sidebar widths.' }
  },
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.surface.subdued',
      'theme.border.subtle',
      'theme.content.default',
      'theme.content.muted',
      'theme.shadow.sm'
    ]
  },
  accessibility: {
    role: 'complementary',
    keyboardSupport: 'Standard focus navigation.',
    screenReader: 'Reads sidebar content boundaries.',
    wcag: 'AA',
    notes: []
  },
  aiHints: {
    priority: 'high',
    keywords: ['sidebar-layout', 'collapsible-sidebar', 'vertical-navigation', 'dashboard-drawer'],
    selectionCriteria: {},
    disambiguateFrom: {}
  },
  examples: []
});
