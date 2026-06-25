import { defineMetadata } from '../../metadata/schema.ts';

export const ResizableMetadata = defineMetadata({
  component: {
    name: 'Resizable',
    category: 'organism',
    description: 'A layout system of panels that can be dynamically resized by dragging a divider.',
    type: 'container',
    path: 'src/components/Resizable/Resizable.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'resizable-split-views',
      'editor-side-panels',
      'workspace-layouts',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'split-workspace',
        description: 'Exposes left and right sidebars with a drag handle.',
        composition: `<ResizablePanelGroup direction="horizontal">
  <ResizablePanel>Left Content</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel>Right Content</ResizablePanel>
</ResizablePanelGroup>`,
      }
    ],
    antiPatterns: []
  },
  behavior: {
    states: [
      { name: 'active-drag', visual: 'Divider handle highlights using background tokens.' }
    ],
    interactions: [
      'Dragging divider updates width ratios of adjacent panels.'
    ],
    responsive: 'Pointers support touch coordinate translations.'
  },
  props: {
    direction: { type: '"horizontal" | "vertical"', default: '"horizontal"', required: false, description: 'Selects axis orientation.' }
  },
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.border.subtle',
      'theme.content.default'
    ]
  },
  accessibility: {
    role: 'separator',
    keyboardSupport: '',
    screenReader: 'Reads boundaries of split views.',
    wcag: 'AA',
    notes: []
  },
  aiHints: {
    priority: 'medium',
    keywords: ['resizable-panels', 'split-view', 'pane-resizer', 'drag-divider'],
    selectionCriteria: {},
    disambiguateFrom: {}
  },
  examples: []
});
