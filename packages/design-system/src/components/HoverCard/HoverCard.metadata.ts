import { defineMetadata } from '../../metadata/schema.ts';

export const HoverCardMetadata = defineMetadata({
  component: {
    name: 'HoverCard',
    category: 'molecule',
    description: 'An information preview card that appears on hover for sighted users, preserving link accessibility.',
    type: 'display',
    path: 'src/components/HoverCard/HoverCard.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'user-profile-preview-cards',
      'link-contextual-previews',
      'dashboard-metric-definition-overviews',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'user-profile-hovercard',
        description: 'Exposes user avatar and stats when hovering a username link.',
        composition: `<HoverCard>
  <HoverCardTrigger asChild>
    <a href="/profile/john">@john_doe</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="flex gap-4">
      <Avatar src="/john.jpg" fallback="JD" />
      <div className="space-y-1">
        <h4 className="font-semibold text-sm">John Doe</h4>
        <p className="text-xs text-[color:var(--ds-theme-content-muted)]">Software developer building systems.</p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using HoverCard as a replacement for interactive tooltips that require click actions.',
        reason: 'HoverCard opens on hover only and closes when pointer leaves. User cannot easily click actions or inputs inside it.',
        alternative: 'Use Popover component for overlays containing buttons, inputs, or menus.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'closed', visual: 'Hover card popup completely hidden.' },
      { name: 'open', visual: 'Fades and zooms in anchored near the cursor/trigger element.' }
    ],
    interactions: [
      'Hovering trigger shows card after small delay.',
      'Moving cursor away from trigger/content hides card.'
    ],
    responsive: 'Repositions content dynamically to prevent clipping on small screen edges.'
  },
  props: {
    openDelay: { type: 'number', default: '700', required: false, description: 'Hover open delay in milliseconds.' },
    closeDelay: { type: 'number', default: '300', required: false, description: 'Hover close delay in milliseconds.' }
  },
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.border.subtle',
      'theme.content.default',
      'theme.shadow.md'
    ]
  },
  accessibility: {
    role: 'dialog',
    keyboardSupport: 'None natively as hover-only, trigger link remains keyboard focusable.',
    screenReader: 'Screen readers read the standard HTML link description inside trigger. Direct interactive cards should use Popover.',
    wcag: 'AA',
    notes: [
      'Follows standard design patterns matching shadcn/ui HoverCard primitives.'
    ]
  },
  aiHints: {
    priority: 'medium',
    keywords: ['hovercard', 'card-preview', 'link-preview', 'popup-card', 'profile-hover'],
    selectionCriteria: {
      'Do you need to show rich preview content (images, bios) when hovering over a user link?': 'Yes, use HoverCard.'
    },
    disambiguateFrom: {
      Tooltip: 'Tooltip is for simple, static text labels. HoverCard can contain images, formatted layouts, and larger descriptions.',
      Popover: 'Popover is click-triggered and handles focus trapping. HoverCard is pointer-triggered (hover).'
    }
  },
  examples: [
    {
      name: 'simple-hover-preview',
      description: 'Link preview hover card.',
      code: `<HoverCard>
  <HoverCardTrigger>Vite.js</HoverCardTrigger>
  <HoverCardContent>
    <p className="text-xs">Next generation frontend tooling. Instant server start, lightning fast HMR.</p>
  </HoverCardContent>
</HoverCard>`
    }
  ]
});
