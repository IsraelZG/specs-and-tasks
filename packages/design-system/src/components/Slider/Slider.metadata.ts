import { defineMetadata } from '../../metadata/schema.ts';

export const SliderMetadata = defineMetadata({
  component: {
    name: 'Slider',
    category: 'atom',
    description: 'An input where the user selects a value from a range by moving a thumb slider.',
    type: 'input',
    path: 'src/components/Slider/Slider.tsx',
    lastUpdated: '2026-05-19T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'volume-controls',
      'brightness-adjusters',
      'price-range-selectors',
      'numeric-limits',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'single-slider',
        description: 'A standard slider choosing a single value.',
        composition: `<Slider defaultValue={[50]} max={100} step={1} />`,
      },
      {
        name: 'range-slider',
        description: 'A dual-handle slider for selecting a range of values (e.g. min/max prices).',
        composition: `<Slider defaultValue={[20, 80]} max={100} step={1} />`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Slider when values are non-numeric or disjoint.',
        reason: 'Sliders represent continuous or stepped numeric ranges. They cannot map easily to unordered strings or boolean options.',
        alternative: 'Use Select, RadioGroup, or Switch components.',
      },
      {
        scenario: 'Omitting visible labels or current values.',
        reason: 'Users often struggle to read the precise value from the position of the handle alone.',
        alternative: 'Place a label above the slider and show the current selected value as text next to it.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'default', visual: 'Grey track with colored primary range fill. White circular thumb with primary border.' },
      { name: 'hover', visual: 'Thumb background transitions to a subdued hue on hover.' },
      { name: 'focus', visual: 'Standard primary focus ring around the active thumb handle.' },
      { name: 'disabled', visual: '50% opacity, track and handles un-interactable, pointer-events-none.' }
    ],
    interactions: [
      'Clicking or tapping anywhere on the track moves the thumb to that position.',
      'Dragging the thumb adjusts the value smoothly.',
      'Arrow keys adjust the value in steps when focused.'
    ],
    responsive: 'Expands to fill track container width.'
  },
  props: {
    value: { type: 'number[]', required: false, description: 'Controlled slider values array.' },
    defaultValue: { type: 'number[]', required: false, description: 'Default initial values array.' },
    onValueChange: { type: '(value: number[]) => void', required: false, description: 'Callback fired when dragging or shifting values.' },
    min: { type: 'number', default: '0', required: false, description: 'Minimum bounds.' },
    max: { type: 'number', default: '100', required: false, description: 'Maximum bounds.' },
    step: { type: 'number', default: '1', required: false, description: 'Increment step size.' },
    disabled: { type: 'boolean', default: 'false', required: false, description: 'Disables editing and interaction.' }
  },
  tokens: {
    semantic: [
      'theme.border.subtle',
      'theme.intent.primary.fill',
      'theme.surface.default',
      'theme.surface.subdued',
      'theme.shadow.sm'
    ]
  },
  accessibility: {
    role: 'slider',
    keyboardSupport: 'Left/Right or Up/Down arrows adjust values. Home/End keys go to boundaries.',
    screenReader: 'Announces slider role, bounds, current value, and state changes.',
    wcag: 'AAA',
    notes: [
      'Fully accessible out of the box using Radix Slider primitive logic.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['slider', 'range', 'handle', 'price-range', 'scale', 'value'],
    selectionCriteria: {
      'Do you need the user to adjust a numeric setting along a range?': 'Yes, use Slider.'
    },
    disambiguateFrom: {
      Input: 'Input (type="number") is for precise keyboard-entered numeric entries. Slider is for graphical approximate adjustments.'
    }
  },
  examples: [
    {
      name: 'labelled-volume-slider',
      description: 'Volume level adjuster with real-time numeric reading.',
      code: `const [volume, setVolume] = useState([50]);
return (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between">
      <Label htmlFor="vol">Volume Level</Label>
      <span className="text-sm">{volume[0]}%</span>
    </div>
    <Slider id="vol" value={volume} onValueChange={setVolume} max={100} />
  </div>
)`
    }
  ]
});
