import { defineMetadata } from '../../metadata/schema.ts';

export const CalendarMetadata = defineMetadata({
  component: {
    name: 'Calendar',
    category: 'molecule',
    description: 'An interactive date selection calendar grid with navigation.',
    type: 'interactive',
    path: 'src/components/Calendar/Calendar.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'date-selection-inputs',
      'schedule-pickers',
      'filters-by-date',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'controlled-calendar',
        description: 'Standard usage with active date state.',
        composition: `const [date, setDate] = useState<Date>(new Date());
<Calendar selected={date} onSelect={setDate} />`,
      }
    ],
    antiPatterns: []
  },
  behavior: {
    states: [
      { name: 'selected', visual: 'Displays highlight background with drop shadow.' },
      { name: 'outside', visual: 'Dimmed style for dates belonging to adjacent months.' }
    ],
    interactions: [
      'Clicking header arrows navigates adjacent months.',
      'Clicking a date calls the onSelect handler.'
    ],
    responsive: 'Paddings and cell spacing scale down automatically.'
  },
  props: {
    selected: { type: 'Date', required: false, description: 'Selected date value.' },
    onSelect: { type: '(date: Date) => void', required: false, description: 'Callback fired on date clicks.' },
    showOutsideDays: { type: 'boolean', default: 'true', required: false, description: 'Renders trailing/leading outside days.' }
  },
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.surface.subdued',
      'theme.border.subtle',
      'theme.content.default',
      'theme.content.muted'
    ]
  },
  accessibility: {
    role: 'grid',
    keyboardSupport: 'Standard tab navigation.',
    screenReader: 'Announces dates and labels.',
    wcag: 'AA',
    notes: []
  },
  aiHints: {
    priority: 'medium',
    keywords: ['calendar', 'date-picker', 'month-grid', 'date-selection'],
    selectionCriteria: {},
    disambiguateFrom: {}
  },
  examples: []
});
