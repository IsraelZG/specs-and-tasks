import { defineMetadata } from '../../metadata/schema.ts';

export const SkeletonMetadata = defineMetadata({
  component: {
    name: 'Skeleton',
    category: 'atom',
    description: 'A placeholder element with built-in pulse animations indicating content loading state.',
    type: 'feedback',
    path: 'src/components/Skeleton/Skeleton.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'asynchronous-content-loading-skeletons',
      'profile-card-placeholders',
      'dashboard-graph-loading-shells',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'profile-card-skeleton',
        description: 'Simulates a profile picture and text lines loading.',
        composition: `<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Overusing skeleton shapes causing layout shift once loaded.',
        reason: 'Skeletons should match the dimensions of the final target content. If they differ, the screen will jump around when items render.',
        alternative: 'Use explicit, matching width and height classes on both the Skeleton and the final component (e.g. h-10 w-10).',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'default', visual: 'Soft grey rounded element blinking with pulse keyframe animation.' }
    ],
    interactions: [
      'None. It acts as a static loading state widget.'
    ],
    responsive: 'Controlled by width/height helper classes.'
  },
  props: {},
  tokens: {
    semantic: [
      'theme.surface.subdued'
    ]
  },
  accessibility: {
    role: 'status',
    keyboardSupport: 'None.',
    screenReader: 'Screen readers read the status container attributes (e.g. aria-label="Loading profile information...").',
    wcag: 'AAA',
    notes: [
      'Include an parent aria-busy="true" on elements undergoing dynamic swaps.'
    ]
  },
  aiHints: {
    priority: 'medium',
    keywords: ['skeleton', 'loading-card', 'shimmer', 'pulse-box', 'loader'],
    selectionCriteria: {
      'Do you need a modern placeholder visual during card/dashboard asynchronous data loading?': 'Yes, use Skeleton.'
    },
    disambiguateFrom: {
      Progress: 'Progress is a linear bar reporting exact completion percentage. Skeleton mimics shapes of loaded cards.'
    }
  },
  examples: [
    {
      name: 'list-loading-state',
      description: 'Mocking list rows loading status.',
      code: `<div className="space-y-3">
  <Skeleton className="h-4 w-[100%]" />
  <Skeleton className="h-4 w-[90%]" />
  <Skeleton className="h-4 w-[80%]" />
</div>`
    }
  ]
});
