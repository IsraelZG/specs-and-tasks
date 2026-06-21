import { defineMetadata } from "../../metadata/schema.ts";

export const NavItemMetadata = defineMetadata({
  component: {
    name: 'NavItem',
    category: 'atom',
    description: 'A single row in a navigation rail or menu. Renders an icon, label, and selected state. Always a link or button — never a plain div.',
    type: 'navigation',
    path: 'src/components/NavItem/NavItem.tsx',
    lastUpdated: '2026-05-17T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'sidebar-navigation',
      'mobile-tab-bar',
      'dropdown-menu-item',
      'settings-list',
      'workspace-switcher',
    ],
    requiredProps: ['children'],

    commonPatterns: [
      {
        name: 'sidebar-link',
        description: 'Primary navigation row inside Sidebar.',
        composition: `<NavItem href="/dashboard" icon={<Icon name="home" />} active={pathname === '/dashboard'}>
  Dashboard
</NavItem>`,
      },
      {
        name: 'with-badge',
        description: 'Trailing badge for counts or status.',
        composition: `<NavItem href="/inbox" icon={<Icon name="inbox" />} trailing={<Badge intent="accent">12</Badge>}>
  Inbox
</NavItem>`,
      },
      {
        name: 'collapsed-rail',
        description: 'In collapsed sidebar — icon only, tooltip provides label.',
        composition: `<NavItem href="/calendar" icon={<Icon name="calendar" />} aria-label="Calendar" collapsed />`,
      },
      {
        name: 'as-button',
        description: 'NavItem that triggers an action instead of navigating (sign out, toggle).',
        composition: `<NavItem as="button" onClick={signOut} icon={<Icon name="log-out" />}>
  Sign out
</NavItem>`,
      },
    ],

    antiPatterns: [
      {
        scenario: 'Rendering NavItem as a <div> with onClick.',
        reason: 'Loses focus, keyboard activation, right-click, and "open in new tab". Worst-case for navigation accessibility.',
        alternative: 'Always set as="a" with href (navigation) or as="button" with onClick (action). Default is <a>.',
      },
      {
        scenario: 'Multiple NavItems marked active=true at the same level.',
        reason: 'Active state means "you are here". Two "here"s is incoherent and breaks aria-current.',
        alternative: 'Exactly one active item per navigation group. Compute it from the current route.',
      },
      {
        scenario: 'Putting full sentences as the label.',
        reason: 'Navigation rows are scanned, not read. Long labels truncate or wrap awkwardly and slow recognition.',
        alternative: 'One or two words. Use Tooltip on hover if extra context is genuinely needed.',
      },
      {
        scenario: 'Using NavItem inside body content as a styled link.',
        reason: 'NavItem carries strong layout assumptions (height, icon slot, active state, hover treatment) that look wrong inline.',
        alternative: 'Use Link for inline navigation. Reserve NavItem for navigation surfaces.',
      },
      {
        scenario: 'Nesting NavItem inside another NavItem to express hierarchy.',
        reason: 'Invalid focus order, ambiguous click target.',
        alternative: 'Use NavGroup (expandable section) as the parent, with NavItems as siblings at the indented level.',
      },
      {
        scenario: 'Icon-only NavItem in a collapsed sidebar without aria-label.',
        reason: 'Screen reader announces an unlabelled link. The entire nav becomes unusable.',
        alternative: 'Set aria-label whenever the label text is visually hidden. Add a Tooltip for sighted users.',
      },
    ],
  },

  variants: {
    tone: {
      options: ['default', 'inverse'],
      default: 'default',
      purpose: {
        default: 'Light surface sidebars. Uses content.muted for inactive, intent.primary for active.',
        inverse: 'Dark navigation rails (the black sidebar in references). Uses content.onInverse text colors.',
      },
    },
    size: {
      options: ['sm', 'md'],
      default: 'md',
      purpose: {
        sm: 'Dropdown menu items, dense secondary navs.',
        md: 'Primary sidebar rows.',
      },
    },
  },

  composition: {
    slots: [
      { name: 'icon',     description: 'Leading icon.',           acceptedComponents: ['Icon'], required: false },
      { name: 'children', description: 'Label text. Hidden visually but kept in DOM when collapsed=true.', acceptedComponents: [], required: true },
      { name: 'trailing', description: 'Trailing content: Badge, count, status dot, chevron.', acceptedComponents: ['Badge', 'Icon', 'Dot'], required: false },
    ],
    commonSiblings: ['NavItem', 'NavGroup', 'NavDivider'],
    parentConstraints: ['Sidebar', 'NavGroup', 'Menu', 'TabBar'],
    forbiddenParents: ['Button', 'Link', 'NavItem'],
  },

  behavior: {
    states: [
      { name: 'default',   visual: 'Transparent bg, content.muted label.' },
      { name: 'hover',     visual: 'Surface.subdued bg, content.strong label.' },
      { name: 'focus',     visual: 'Focus ring (focusRing tokens).' },
      { name: 'active',    visual: 'intent.primary.fill bg, intent.primary.onFill label.', semantic: 'aria-current="page" (when navigation).' },
      { name: 'disabled',  visual: 'content.disabled label, no hover.' },
    ],
    interactions: [
      'Click / Tap activates navigation or onClick.',
      'Enter / Space activate when focused.',
      'Arrow keys MAY navigate between sibling NavItems when inside Menu (handled by parent).',
    ],
    responsive: 'In Sidebar collapsed mode: label visually hidden, icon centered, Tooltip provides label on hover. On mobile TabBar: stacks icon over label, smaller height.',
    motion: 'Background and color transitions use motion.preset.hover. Active state has no animation — instant feedback.',
  },

  props: {
    children:    { type: 'ReactNode',                       required: true,  description: 'Label content.', acceptsNode: true },
    as:          { type: `'a' | 'button'`,                  default: `'a'`,  required: false, description: 'Underlying element. Use "a" for navigation, "button" for actions.' },
    href:        { type: 'string',                          required: false, description: 'Required when as="a".' },
    onClick:     { type: '(e: MouseEvent) => void',         required: false, description: 'Required when as="button".' },
    icon:        { type: 'ReactNode',                       required: false, description: 'Leading icon.', acceptsNode: true },
    trailing:    { type: 'ReactNode',                       required: false, description: 'Trailing content (badge, dot, chevron).', acceptsNode: true },
    active:      { type: 'boolean',                         default: 'false', required: false, description: 'Marks this item as the current location. Only one per group.' },
    disabled:    { type: 'boolean',                         default: 'false', required: false, description: 'Block interaction.' },
    collapsed:   { type: 'boolean',                         default: 'false', required: false, description: 'Hides label visually while keeping it for screen readers and tooltips.' },
    tone:        { type: `'default' | 'inverse'`,           default: `'default'`, required: false, description: 'Color scheme for dark vs light navigation surfaces.' },
    size:        { type: `'sm' | 'md'`,                     default: `'md'`, required: false, description: 'Row height.' },
    'aria-label':{ type: 'string',                          required: false, description: 'Required when collapsed=true or when children is icon-only.' },
  },

  tokens: {
    semantic: [
      'component.navigation.item.{radius,height,paddingX,gap}',
      'component.navigation.item.{bgActive,textActive,bgHover,textInactive}',
      'focusRing.{width,offset,color,shadow}',
    ],
    theme: ['theme.surface.inverse', 'theme.content.onInverse'],
    primitive: [],
  },

  accessibility: {
    role: 'link when as="a", button when as="button"',
    keyboardSupport: 'Tab focuses. Enter/Space activate. When inside Menu or TabBar, arrow keys move between items (handled by parent).',
    screenReader: 'Announces "link/button, <label>, current page" when active=true.',
    wcag: 'AA',
    notes: [
      'NavItem MUST render as <a> or <button> — never a div with onClick.',
      'When active=true, the component sets aria-current="page". Do not also set it manually.',
      'Collapsed/icon-only states REQUIRE aria-label.',
      'Active state must not be color-only — the bg fill and label weight together provide redundant cues.',
    ],
  },

  aiHints: {
    priority: 'high',
    keywords: ['nav', 'menu', 'sidebar', 'link', 'tab', 'navigation', 'route'],

    selectionCriteria: {
      'Does this go inside a Sidebar, Menu, or TabBar?':
        'Yes → NavItem. No → use Link (inline) or Button (action).',
      'Does activating it change the URL?':
        'Use as="a" (default) with href. Do NOT use as="button" for navigation.',
      'Does activating it trigger an action (sign out, toggle)?':
        'Use as="button" with onClick.',
      'How do I mark the current page?':
        'Set active={currentRoute === href}. Only one item per group should be active.',
      'The sidebar is collapsed — what about labels?':
        'Set collapsed AND aria-label. The visual label is hidden; the screen-reader label remains.',
      'Need a count or status next to the label?':
        'Pass it via the trailing slot. Use Badge for counts, Dot for status.',
    },

    disambiguateFrom: {
      Link:    'Link is for inline navigation in body content. NavItem is for navigation surfaces.',
      Button:  'Button is for actions in content surfaces. NavItem styled-as-button is only for actions LIVING inside navigation surfaces (sign out, theme toggle).',
      Tab:     'Tab switches the panel below within the same page. NavItem moves to a different page or route.',
      MenuItem:'MenuItem is for actions inside Menu/Popover lists. NavItem is for navigation rows. They look similar but live in different parents.',
    },
  },

  examples: [
    {
      name: 'primary-sidebar',
      description: 'Inverse-tone sidebar with active state driven by the current route.',
      code: `<Sidebar tone="inverse">
  <NavItem href="/dashboard"  icon={<Icon name="home" />}     active={path === '/dashboard'}>Dashboard</NavItem>
  <NavItem href="/messages"   icon={<Icon name="message" />}  trailing={<Badge>3</Badge>}>Messages</NavItem>
  <NavItem href="/calendar"   icon={<Icon name="calendar" />}>Calendar</NavItem>
  <NavDivider />
  <NavItem as="button" onClick={signOut} icon={<Icon name="log-out" />}>Sign out</NavItem>
</Sidebar>`,
    },
  ],
});
