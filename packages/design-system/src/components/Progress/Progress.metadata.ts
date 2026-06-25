import { defineMetadata } from '../../metadata/schema.ts';

export const ProgressMetadata = defineMetadata({
  component: {
    name: 'Progress',
    category: 'atom',
    description: 'A visual progress bar displaying numeric completeness states.',
    type: 'display',
    path: 'src/components/Progress/Progress.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'file-upload-status',
      'setup-wizard-steppers',
      'loading-indicators',
    ],
    requiredProps: ['value'],
    commonPatterns: [
      {
        name: 'loading-progress',
        description: 'Exposes loading progress percentage values.',
        composition: `<Progress value={60} />`,
      }
    ],
    antiPatterns: []
  },
  behavior: {
    states: [
      { name: 'determinate', visual: 'Indicators translate relative to values.' }
    ],
    interactions: [],
    responsive: 'Width stretches to 100% of container elements.'
  },
  props: {
    value: { type: 'number', required: true, description: 'Percentage completion value (from 0 to 100).' }
  },
  tokens: {
    semantic: [
      'theme.surface.subdued',
      'theme.content.default'
    ]
  },
  accessibility: {
    role: 'progressbar',
    keyboardSupport: '',
    screenReader: 'Announces completion value progress automatically.',
    wcag: 'AAA',
    notes: []
  },
  aiHints: {
    priority: 'high',
    keywords: ['progress-bar', 'loading-indicator', 'percentage-indicator'],
    selectionCriteria: {},
    disambiguateFrom: {}
  },
  examples: []
});
