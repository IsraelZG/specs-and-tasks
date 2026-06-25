import { defineMetadata } from '../../metadata/schema.ts';

export const AvatarMetadata = defineMetadata({
  component: {
    name: 'Avatar',
    category: 'atom',
    description: 'Circular user representation. Shows a photo, initials, or a fallback icon when no image is available.',
    type: 'display',
    path: 'src/components/Avatar/Avatar.tsx',
    lastUpdated: '2026-05-18T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'user-identity',
      'message-sender',
      'assignee-indicator',
      'profile-thumbnail',
      'avatar-group',
    ],
    requiredProps: [],

    commonPatterns: [
      {
        name: 'photo-with-fallback',
        description: 'Shows a profile photo and falls back to initials if it fails to load.',
        composition: `<Avatar src={user.avatarUrl} fallback="JD" alt={user.name} />`,
      },
      {
        name: 'message-sender',
        description: 'Small avatar beside a chat message.',
        composition: `<Avatar src={sender.avatar} alt={sender.name} size="sm" />`,
      },
      {
        name: 'initials-only',
        description: 'No image source — always shows initials.',
        composition: `<Avatar fallback="AB" alt="Alice Bowen" size="md" />`,
      },
      {
        name: 'ring-highlight',
        description: 'Active user or selected state with a ring.',
        composition: `<Avatar src={user.avatar} alt={user.name} ring />`,
      },
    ],

    antiPatterns: [
      {
        scenario: 'Adding onClick directly to Avatar to make it navigate to a profile.',
        reason: 'Avatar is a display atom. A div with onClick is not keyboard-accessible and has no ARIA role.',
        alternative: 'Wrap Avatar in a Button (variant="ghost") or a Link. The interactive wrapper owns the semantics.',
      },
      {
        scenario: 'Omitting alt when the Avatar conveys the user\'s identity.',
        reason: 'Screen readers skip the image entirely, leaving no identity signal for assistive tech users.',
        alternative: 'Always pass alt={user.name}. If the name is already in adjacent text, use alt="" to mark it as decorative.',
      },
      {
        scenario: 'Using Avatar for non-person images (product thumbnails, brand logos).',
        reason: 'Avatar\'s circular crop and person-identity semantics mislead users and screen readers.',
        alternative: 'Use a plain <img> or a dedicated Thumbnail component for non-person imagery.',
      },
      {
        scenario: 'Stacking more than 5 overlapping Avatars without a "+N more" overflow.',
        reason: 'The pile becomes unreadable and the exact count is lost.',
        alternative: 'Show up to 4 Avatars, then add a Badge or plain text for the remainder (+3 more).',
      },
      {
        scenario: 'Using size="xs" for interactive Avatars (clickable, focusable).',
        reason: 'xs avatars (20px) are below the 44px touch-target minimum on touch-primary surfaces.',
        alternative: 'Use size="md" or larger for interactive Avatars, or add padding to the wrapping element.',
      },
    ],
  },

  variants: {
    size: {
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      default: 'md',
      purpose: {
        xs:  'Avatar groups, compact nav icons. Not for interactive contexts on touch devices.',
        sm:  'Message senders, comment threads, tight list rows.',
        md:  'Default for most surfaces: cards, profile rows, assignee fields.',
        lg:  'Profile pages, team directories, prominent user callouts.',
        xl:  'Hero profile sections, current-user account menus.',
        '2xl': 'Full-page profile headers and onboarding screens.',
      },
    },
  },

  behavior: {
    states: [
      { name: 'image-loaded',  visual: 'Circular photo, clipped to the avatar radius.' },
      { name: 'image-error',   visual: 'Fallback: initials text centered on tinted background, or a generic person icon.' },
      { name: 'loading',       visual: 'Subtle pulsing placeholder (skeleton) until image resolves.' },
    ],
    interactions: [],
    responsive: 'Size is fixed by the size prop. Never resizes automatically.',
    motion: 'None on the Avatar itself. Loading placeholder may use a pulse animation.',
  },

  props: {
    src:      { type: 'string',                                       required: false, description: 'URL of the profile image.' },
    alt:      { type: 'string',                                       required: false, description: 'Accessible description. Use user\'s name, or empty string if decorative.' },
    fallback: { type: 'string',                                       required: false, description: '1–2 character initials shown when src is absent or fails.' },
    size:     { type: `'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'`,   default: `'md'`, required: false, description: 'Visual size.' },
    ring:     { type: 'boolean',                                      default: 'false', required: false, description: 'Adds a ring outline — use for active/selected states.' },
  },

  tokens: {
    semantic: [
      'component.avatar.{radius,ringWidth,ringColor}',
      'component.avatar.size.{xs,sm,md,lg,xl,2xl}',
      'component.avatar.fallback.{bg,text}',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'img (when src is present); presentation (when initials only)',
    keyboardSupport: 'Not interactive. No keyboard behaviour on the Avatar itself.',
    screenReader: 'When src is provided, announces as image with alt text. When showing initials, the fallback text is readable. Set alt="" if the user\'s name is already in adjacent text.',
    wcag: 'AA',
    notes: [
      'Always provide alt={user.name} unless the identity is conveyed by adjacent text.',
      'Interactive Avatars must be wrapped in a Button or Link for focus, keyboard, and screen-reader support.',
      'Touch targets for interactive Avatars must be ≥ 44×44 px — add padding to the wrapper, not the Avatar itself.',
    ],
  },

  aiHints: {
    priority: 'high',
    keywords: ['avatar', 'profile', 'photo', 'user', 'person', 'initials', 'picture', 'image', 'face'],

    selectionCriteria: {
      'Is this a profile photo or user identity thumbnail?':
        'YES — use Avatar. Pass src and alt={user.name}.',
      'Should the avatar be clickable (navigate to profile)?':
        'Wrap Avatar in a Link or Button. Avatar itself is display-only.',
      'Is the image a product, logo, or non-person graphic?':
        'Use a plain <img> or a Thumbnail component — not Avatar. Avatar implies person-identity.',
      'Is there no image and only initials needed?':
        'Pass fallback="JD" without a src prop. Avatar renders the initials on a tinted background.',
      'Are multiple avatars stacked in a group?':
        'Apply negative margin on the wrapper and limit visible count to 4 with a "+N" overflow label.',
    },

    disambiguateFrom: {
      Badge: 'Badge shows a status label or count. Avatar shows a person\'s identity.',
      Card:  'Card is a content container. Avatar is a person thumbnail that lives inside a Card.',
      Button:'Button triggers actions. If the Avatar is clickable, the Button wraps it — Avatar is not the Button.',
    },
  },

  examples: [
    {
      name: 'comment-thread-row',
      description: 'Avatar + name + timestamp in a comment list.',
      code: `<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <Avatar src={comment.author.avatar} alt={comment.author.name} size="sm" />
  <div>
    <span>{comment.author.name}</span>
    <time>{comment.createdAt}</time>
  </div>
</div>`,
    },
    {
      name: 'assignee-field',
      description: 'Clickable avatar that opens a user-picker.',
      code: `<Button variant="ghost" size="sm" onClick={openPicker} aria-label="Change assignee">
  <Avatar
    src={assignee?.avatar}
    fallback={assignee ? getInitials(assignee.name) : '?'}
    alt={assignee?.name ?? 'Unassigned'}
    size="sm"
  />
  {assignee?.name ?? 'Unassigned'}
</Button>`,
    },
    {
      name: 'avatar-group-overflow',
      description: 'Up to 4 avatars stacked with overflow count.',
      code: `<div style={{ display: 'flex' }}>
  {members.slice(0, 4).map((m) => (
    <Avatar key={m.id} src={m.avatar} alt={m.name} size="sm"
      style={{ marginLeft: -8, outline: '2px solid var(--ds-component-avatar-ring-color)' }}
    />
  ))}
  {members.length > 4 && (
    <Badge intent="neutral" size="sm">+{members.length - 4}</Badge>
  )}
</div>`,
    },
  ],
});
