import { defineMetadata } from "../../metadata/schema.ts";

export const CardMetadata = defineMetadata({
  component: {
    name: 'Card',
    category: 'molecule',
    description: 'Elevated rectangular surface that groups related content. The workhorse container of dashboards, lists, and marketing layouts.',
    type: 'container',
    path: 'src/components/Card/Card.tsx',
    lastUpdated: '2026-05-17T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'dashboard-metric',
      'list-item',
      'product-tile',
      'feature-block',
      'profile-summary',
      'settings-section',
    ],
    requiredProps: ['children'],

    commonPatterns: [
      {
        name: 'metric-card',
        description: 'Dashboard KPI with title, value, and a delta badge.',
        composition: `<Card>
  <Text variant="overline">Revenue</Text>
  <Text variant="displayMd">$28.4k</Text>
  <Badge intent="success">+12%</Badge>
</Card>`,
      },
      {
        name: 'list-row',
        description: 'Card as a clickable list item — wraps everything in a single action target.',
        composition: `<Card as="button" onClick={open} interactive>
  <Avatar src={user.avatar} />
  <Stack>
    <Text variant="headingSm">{user.name}</Text>
    <Text variant="bodySm">{user.role}</Text>
  </Stack>
  <Icon name="chevron-right" />
</Card>`,
      },
      {
        name: 'product-tile',
        description: 'Marketplace product with image, title, price, and CTA.',
        composition: `<Card>
  <CardMedia src={product.image} alt={product.name} />
  <Text variant="headingSm">{product.name}</Text>
  <Text variant="bodySm">{formatPrice(product.price)}</Text>
  <Button variant="primary" fullWidth>Add to cart</Button>
</Card>`,
      },
    ],

    antiPatterns: [
      {
        scenario: 'Nesting a Card directly inside another Card.',
        reason: 'Doubles up shadows and borders, creates ambiguous focus and click targets, and visually flattens hierarchy.',
        alternative: 'Use a Section, Panel, or plain Stack inside the outer Card. Reserve Card for the outermost grouping.',
      },
      {
        scenario: 'Making a Card "clickable" by adding onClick to the root <div>.',
        reason: 'Not focusable, not keyboard-accessible, screen readers cannot announce it as actionable.',
        alternative: 'Set `as="button"` or `as="a"` and use the `interactive` prop. The component handles role, tabIndex, and focus styling.',
      },
      {
        scenario: 'Using Card as a wrapper around a single line of text or a single Button.',
        reason: 'Cards imply grouped content. One element does not need grouping.',
        alternative: 'Render the element directly. If you need emphasis, use Badge, Callout, or a heavier text style.',
      },
      {
        scenario: 'Stuffing two unrelated subjects into one Card to "save space".',
        reason: 'Cards signal that their contents belong together. Mixing topics teaches users the grouping is meaningless.',
        alternative: 'Two Cards in a Grid. Use spacing, not visual containers, to fit.',
      },
      {
        scenario: 'Removing the border AND the shadow to "make it cleaner".',
        reason: 'Without elevation cues, the Card no longer reads as a grouping — it is just a div.',
        alternative: 'Use Stack with spacing tokens for visually flat grouping. Save Card for when the elevation actually means "this is one unit".',
      },
    ],
  },

  variants: {
    interactive: {
      options: ['false', 'true'],
      default: 'false',
      purpose: {
        false: 'Static container. No hover state, no focus ring.',
        true:  'Card is the click target — adds hover elevation, focus ring, and pointer cursor. Requires `as="button"` or `as="a"` for accessibility.',
      },
    },
    padding: {
      options: ['none', 'sm', 'md', 'lg'],
      default: 'md',
      purpose: {
        none: 'Bleeding content (images, custom layouts). Apply padding inside yourself.',
        sm:   'Dense surfaces like list rows.',
        md:   'Default for product cards, settings rows, dashboards.',
        lg:   'Marketing and onboarding moments.',
      },
    },
  },

  composition: {
    slots: [
      {
        name: 'children',
        description: 'Card content. Typically a vertical Stack of text, media, and actions.',
        acceptedComponents: [],
        forbiddenComponents: ['Card', 'Modal'],
        required: true,
      },
    ],
    commonSiblings: ['Card', 'Stack', 'Grid'],
    parentConstraints: [],
    forbiddenParents: ['Card', 'Button', 'Link'],
  },

  behavior: {
    states: [
      { name: 'default',  visual: 'Raised surface, subtle border, sm shadow.' },
      { name: 'hover',    visual: 'When interactive: shadow grows to md, translateY(-2px).', semantic: 'Cursor: pointer.' },
      { name: 'focus',    visual: 'When interactive: focus ring on the Card boundary.' },
      { name: 'pressed',  visual: 'When interactive: shadow returns to sm, no translate.' },
    ],
    interactions: [
      'When interactive: full surface is the action target. Click anywhere fires onClick.',
      'Keyboard: Enter/Space activate when focused.',
    ],
    responsive: 'Card width follows its container. Pair with Grid for multi-column layouts. On narrow viewports, Cards typically stack 1-up.',
    motion: 'Hover elevation uses motion.preset.hover. Avoid heavier motion on cards in lists — multiplies visual noise.',
  },

  props: {
    children:    { type: 'ReactNode',                                    required: true,  description: 'Card content.', acceptsNode: true },
    as:          { type: `'div' | 'article' | 'section' | 'button' | 'a'`, default: `'div'`, required: false, description: 'Underlying HTML element. Must be "button" or "a" when interactive=true.' },
    interactive: { type: 'boolean',                                       default: 'false', required: false, description: 'Promote the whole Card to a clickable surface.' },
    padding:     { type: `'none' | 'sm' | 'md' | 'lg'`,                   default: `'md'`,  required: false, description: 'Internal spacing.' },
    onClick:     { type: '(e: MouseEvent) => void',                       required: false,                   description: 'Required when interactive=true.' },
    href:        { type: 'string',                                        required: false,                   description: 'Used when as="a".' },
  },

  tokens: {
    semantic: [
      'component.card.{radius,padding.{none,sm,md,lg},bg,border,shadow,shadowHover}',
      'focusRing.{width,offset,color,shadow}',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'group when static; button or link when interactive',
    keyboardSupport: 'Static: none. Interactive: Tab to focus, Enter/Space to activate.',
    screenReader: 'Static cards do not announce. Interactive cards announce as button/link with their accessible name (often the heading inside).',
    wcag: 'AA',
    notes: [
      'Interactive cards MUST render as <button> or <a>. Adding onClick to a <div> fails accessibility.',
      'When interactive, ensure the most informative text (often a heading) is read first by the screen reader.',
      'Avoid nested interactive elements inside an interactive Card — the inner clicks become ambiguous.',
    ],
  },

  aiHints: {
    priority: 'high',
    keywords: ['card', 'tile', 'panel', 'box', 'container', 'group', 'block'],

    selectionCriteria: {
      'Is this one grouped unit of related info?':
        'Yes → Card. No → use Stack with spacing, not Card.',
      'Does the user click the whole thing to drill in?':
        'Set interactive + as="button" or as="a" so it is actually accessible.',
      'Am I about to nest Card inside Card?':
        'STOP. Use Section or Stack inside. Card should be the outermost grouping.',
      'Is this floating above other content (modal, popover)?':
        'Use Modal or Popover, not Card. They handle focus trap, scrim, and z-index.',
      'Does the card hold a single value or a single button?':
        'Probably do not need a Card. Reach for the bare element with proper text styling.',
    },

    disambiguateFrom: {
      Section: 'Section is structural and visually flat. Card is grouped AND elevated.',
      Panel:   'Panel is a static framed container often used inside Card. Lower visual weight.',
      Modal:   'Modal is floating and blocks the rest of the UI. Card sits in-flow.',
      Popover: 'Popover is floating and anchored to a trigger. Card is in-flow.',
      Tile:    'Tile is a square/aspect-locked sibling of Card, common in grids of equal-sized items.',
    },
  },

  examples: [
    {
      name: 'kpi-grid',
      description: 'Two-up grid of metric cards on a dashboard.',
      code: `<Grid cols={{ base: 1, md: 2 }} gap="4">
  <Card>
    <Text variant="overline">Revenue</Text>
    <Text variant="displayMd">$28.4k</Text>
    <Badge intent="success">+12%</Badge>
  </Card>
  <Card>
    <Text variant="overline">Active users</Text>
    <Text variant="displayMd">1,284</Text>
    <Badge intent="info">Live</Badge>
  </Card>
</Grid>`,
    },
    {
      name: 'interactive-list-row',
      description: 'Clickable Card row inside a list of conversations.',
      code: `<Stack gap="2">
  {threads.map(t => (
    <Card key={t.id} as="button" interactive onClick={() => open(t.id)}>
      <Avatar src={t.user.avatar} />
      <Stack>
        <Text variant="headingSm">{t.user.name}</Text>
        <Text variant="bodySm">{t.preview}</Text>
      </Stack>
    </Card>
  ))}
</Stack>`,
    },
  ],
});
