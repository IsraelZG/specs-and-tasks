import { defineMetadata } from "../../metadata/schema.ts";

export const MessageMetadata = defineMetadata({
  component: {
    name: 'Message',
    category: 'molecule',
    description: 'A single chat bubble. The unit of conversation UIs: messaging, AI chat, support, comments.',
    type: 'display',
    path: 'src/components/Message/Message.tsx',
    lastUpdated: '2026-05-17T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'direct-messaging',
      'group-chat',
      'ai-assistant-response',
      'support-conversation',
      'inline-comments',
    ],
    requiredProps: ['author', 'children'],

    commonPatterns: [
      {
        name: 'received-message',
        description: 'Message from the other party. Left-aligned, neutral surface.',
        composition: `<Message author="received" timestamp={msg.sentAt}>
  {msg.text}
</Message>`,
      },
      {
        name: 'sent-message',
        description: 'Message from the current user. Right-aligned, accent fill.',
        composition: `<Message author="sent" timestamp={msg.sentAt} status="delivered">
  {msg.text}
</Message>`,
      },
      {
        name: 'ai-with-attachment',
        description: 'AI assistant message with an embedded artifact card.',
        composition: `<Message author="ai" timestamp={msg.sentAt}>
  Here is the summary you asked for.
  <ArtifactCard title="Q4 report" href={msg.artifactUrl} />
</Message>`,
      },
      {
        name: 'grouped-thread',
        description: 'Three consecutive messages from the same author. Avatar and name show only on the first.',
        composition: `<MessageGroup author={user}>
  <Message author="received">First line.</Message>
  <Message author="received">Second line.</Message>
  <Message author="received" timestamp={msg.sentAt}>Third line.</Message>
</MessageGroup>`,
      },
    ],

    antiPatterns: [
      {
        scenario: 'Using Message for non-conversational content (notifications, system alerts).',
        reason: 'Message implies a sender and a conversation. Notifications and alerts have no author and live in a different mental model.',
        alternative: 'Use Toast for ephemeral notifications, Alert for inline status, ActivityItem for feeds.',
      },
      {
        scenario: 'Putting a large embedded form, multi-step wizard, or full Card inside a Message.',
        reason: 'Chat bubbles are read sequentially and scrolled past. Complex UI inside loses focus order and is unreachable on history scroll.',
        alternative: 'Render an ArtifactCard that links to the full surface, or push the wizard into a side panel.',
      },
      {
        scenario: 'Rendering the timestamp on EVERY message in a long run.',
        reason: 'Visual noise. Users only need timestamps at conversation boundaries (gaps in time, day breaks, last message).',
        alternative: 'Show timestamp on the last of a group, on day-change separators, and on hover for everything else.',
      },
      {
        scenario: 'Mixing author="sent" alignment with author="received" coloring (or vice versa).',
        reason: 'Direction and color are the two cues users use to parse who is talking. Decoupling them breaks scanning.',
        alternative: 'Keep author as the single source of truth. The Message decides alignment AND color from it.',
      },
      {
        scenario: 'Making the entire Message clickable to open a context menu.',
        reason: 'Selecting text inside the message becomes impossible. Long-press is the established gesture on touch; right-click on desktop.',
        alternative: 'Expose actions via hover toolbar or context menu; keep the message body selectable.',
      },
    ],
  },

  variants: {
    author: {
      options: ['sent', 'received', 'ai', 'system'],
      default: 'received',
      purpose: {
        sent:     'Current user. Right-aligned, primary fill, white text.',
        received: 'Another user. Left-aligned, subdued surface, default text.',
        ai:       'AI assistant. Left-aligned, distinct accent (intent.accent.subtle), often with a small AI badge.',
        system:   'System event (joined, left, encrypted). Centered, no bubble, muted text. Use sparingly.',
      },
    },
    density: {
      options: ['cozy', 'compact'],
      default: 'cozy',
      purpose: {
        cozy:    'Default for messaging UIs.',
        compact: 'Power-user contexts: terminal-like chats, dev assistant logs.',
      },
    },
  },

  composition: {
    slots: [
      {
        name: 'children',
        description: 'Message body. Text or lightweight embedded content (links, mentions, code spans, single ArtifactCard).',
        acceptedComponents: ['ArtifactCard', 'Mention', 'Link', 'Code'],
        forbiddenComponents: ['Card', 'Modal', 'Form'],
        required: true,
      },
      {
        name: 'reactions',
        description: 'Emoji reactions row beneath the bubble.',
        acceptedComponents: ['ReactionGroup'],
        required: false,
      },
    ],
    commonSiblings: ['Message', 'DayDivider', 'TypingIndicator'],
    parentConstraints: ['MessageList', 'MessageGroup'],
    forbiddenParents: ['Card', 'Button'],
  },

  behavior: {
    states: [
      { name: 'default',  visual: 'Bubble with author-appropriate fill and alignment.' },
      { name: 'hover',    visual: 'Action toolbar fades in (reply, react, more).', semantic: 'Pointer-only — touch uses long-press.' },
      { name: 'sending',  visual: 'Reduced opacity, status="sending" icon.', semantic: 'aria-busy="true".' },
      { name: 'failed',   visual: 'Danger border, "Failed — retry" affordance.' },
      { name: 'editing',  visual: 'Bubble swaps for an inline editor.' },
      { name: 'highlighted', visual: 'Yellow flash when navigated to from a notification.' },
    ],
    interactions: [
      'Hover: action toolbar appears.',
      'Long-press (touch) / right-click (desktop): context menu.',
      'Double-tap (touch): quick react with default emoji.',
      'Esc cancels edit mode.',
    ],
    responsive: 'Max-width clamps to ~70% of the conversation column. On narrow viewports, max-width relaxes to ~85%. Action toolbar collapses to overflow menu.',
    motion: 'Enter: slide-up + fade (motion.preset.enter). Exit on delete: fade only. Highlight flash uses motion.duration.slow.',
  },

  props: {
    children:  { type: 'ReactNode',                                              required: true,  description: 'Message body.', acceptsNode: true },
    author:    { type: `'sent' | 'received' | 'ai' | 'system'`,                  required: true,  description: 'Who is speaking. Drives alignment AND color.' },
    timestamp: { type: 'Date | string',                                          required: false, description: 'When sent. ISO string or Date.' },
    status:    { type: `'sending' | 'sent' | 'delivered' | 'read' | 'failed'`,   required: false, description: 'Delivery state. Only meaningful for author="sent".' },
    density:   { type: `'cozy' | 'compact'`,                                     default: `'cozy'`, required: false, description: 'Vertical density.' },
    reactions: { type: 'ReactNode',                                              required: false, description: 'Reactions row below the bubble.', acceptsNode: true },
    isEditing: { type: 'boolean',                                                default: 'false', required: false, description: 'Render the inline editor in place of the body.' },
  },

  tokens: {
    semantic: [
      'component.message.{radius,paddingX,paddingY}',
      'component.message.{bgSent,textSent,bgReceived,textReceived}',
    ],
    theme: [
      'theme.intent.accent.subtle',
      'theme.intent.accent.onSubtle',
      'theme.intent.danger.border',
    ],
    primitive: [],
  },

  accessibility: {
    role: 'article (for each message); the parent MessageList has role="log" with aria-live="polite".',
    keyboardSupport: 'Tab navigates the action toolbar when hovered/focused. Arrow keys can navigate between messages in MessageList.',
    screenReader: 'Announces author + body + timestamp (when present) + status (when sent + delivered/read).',
    wcag: 'AA',
    notes: [
      'Message bubbles must meet 4.5:1 contrast — text on accent fill is the critical check for sent bubbles.',
      'Status icons (sent, delivered, read) must include a sr-only label, not be color-only.',
      'For AI messages, set author="ai" so the component adds the visible badge AND announces "AI assistant: …".',
      'Long messages should NOT auto-collapse without an explicit "Show more" — content disappearing fails users with cognitive disabilities.',
    ],
  },

  aiHints: {
    priority: 'high',
    keywords: ['message', 'chat', 'bubble', 'conversation', 'thread', 'dm', 'reply', 'comment'],

    selectionCriteria: {
      'Is this a chat / DM / AI conversation surface?':
        'Yes → Message inside MessageList. No → consider Toast, Alert, ActivityItem.',
      'Who is the author?':
        'Always set author. "sent" for current user, "received" for others, "ai" for the assistant, "system" for events.',
      'Is the message from the AI assistant?':
        'Use author="ai" — adds the assistant badge and proper sr label. Do NOT style a regular received message to look like AI.',
      'Do I need to show every timestamp?':
        'No. Render timestamps at conversation boundaries and on hover.',
      'Where does an embedded artifact or attachment go?':
        'Inside children, using ArtifactCard or AttachmentChip. Avoid full Cards inside Messages.',
    },

    disambiguateFrom: {
      Toast:        'Toast is ephemeral, system-originated, dismisses itself. Message is part of a persistent conversation.',
      Alert:        'Alert is inline status (errors, warnings). Message is conversational content.',
      Comment:      'Comment is anchored to a target (document, file). Message lives in a chat list.',
      ActivityItem: 'ActivityItem is a feed entry ("Alice merged PR #42"). Message is dialogic.',
      Callout:      'Callout is a static highlight in document content. Message is conversational.',
    },
  },

  examples: [
    {
      name: 'mixed-thread',
      description: 'Conversation between user, peer, and AI assistant.',
      code: `<MessageList>
  <DayDivider date={today} />
  <Message author="received">Tudo pronto pra reunião?</Message>
  <Message author="sent" status="read" timestamp={t1}>Sim, vou enviar o link.</Message>
  <Message author="ai" timestamp={t2}>
    Lembrete: reunião com Maya em 15min. Quer que eu prepare um resumo da última conversa?
  </Message>
  <Message author="sent" status="delivered" timestamp={t3}>Por favor 🙏</Message>
</MessageList>`,
    },
  ],
});
