import { defineMetadata } from '../../metadata/schema.ts';

export const AspectRatioMetadata = defineMetadata({
  component: {
    name: 'AspectRatio',
    category: 'atom',
    description: 'Displays content within a desired aspect ratio (e.g. 16:9, 4:3, 1:1).',
    type: 'layout',
    path: 'src/components/AspectRatio/AspectRatio.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'responsive-video-embeds',
      'consistent-image-cards',
      'user-avatar-cropping-previews',
    ],
    requiredProps: ['ratio'],
    commonPatterns: [
      {
        name: 'sixteen-nine-ratio',
        description: 'Standard widescreen display for video placeholders or headers.',
        composition: `<div className="w-[450px]">
  <AspectRatio ratio={16 / 9}>
    <img src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd" alt="Landscape" className="object-cover w-full h-full rounded-md" />
  </AspectRatio>
</div>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Forgetting to specify absolute width on container or AspectRatio wrapper.',
        reason: 'AspectRatio expands to fit the width of its parent element. If the parent does not restrict width, the container will expand infinitely or collapse.',
        alternative: 'Always enclose the AspectRatio in a container with a defined width (e.g. w-[300px], w-full, max-w-sm).',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'default', visual: 'Positions children inside a absolute layout container matching the designated proportion.' }
    ],
    interactions: [
      'Static wrapper. Standard pointer events apply to child elements.'
    ],
    responsive: 'Responsively scales height as parent width changes to preserve proportion.'
  },
  props: {
    ratio: { type: 'number', default: '1', required: true, description: 'Desired aspect ratio (e.g. 16 / 9 or 1).' }
  },
  tokens: {
    semantic: []
  },
  accessibility: {
    role: 'presentation',
    keyboardSupport: 'None.',
    screenReader: 'Ignored decotative aspect wrapper; reads children contents directly.',
    wcag: 'AAA',
    notes: [
      'Accessible out of the box using Radix AspectRatio primitives.'
    ]
  },
  aiHints: {
    priority: 'medium',
    keywords: ['aspectratio', 'ratio', 'image-box', 'box-ratio', 'video-container'],
    selectionCriteria: {
      'Do you need to ensure an image or video does not stretch or warp and maintains a specific proportion?': 'Yes, use AspectRatio.'
    },
    disambiguateFrom: {
      Card: 'Card is a container structure with border. AspectRatio is a layout helper focusing purely on bounding proportions.'
    }
  },
  examples: [
    {
      name: 'square-profile-card',
      description: 'Square image wrapper for profile avatar cards.',
      code: `<div className="w-40">
  <AspectRatio ratio={1}>
    <img src="/avatar.jpg" alt="Profile" className="object-cover w-full h-full rounded-full" />
  </AspectRatio>
</div>`
    }
  ]
});
