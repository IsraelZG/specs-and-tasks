import { defineMetadata } from '../../metadata/schema.ts';

export const TableMetadata = defineMetadata({
  component: {
    name: 'Table',
    category: 'molecule',
    description: 'A responsive grid element displaying structured datasets.',
    type: 'display',
    path: 'src/components/Table/Table.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'data-grids',
      'transactions-lists',
      'user-directories',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'simple-data-table',
        description: 'Exposes rows of text data.',
        composition: `<Table>
  <TableHeader>
    <TableRow>
      <TableHead>User</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Israel</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
      }
    ],
    antiPatterns: []
  },
  behavior: {
    states: [
      { name: 'hover', visual: 'Highlights table row with subdued surface color.' }
    ],
    interactions: [],
    responsive: 'Wraps content inside responsive scroll containers.'
  },
  props: {},
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
    role: 'table',
    keyboardSupport: '',
    screenReader: 'Reads semantic column headers, cell contexts, and total count indices.',
    wcag: 'AAA',
    notes: []
  },
  aiHints: {
    priority: 'high',
    keywords: ['table', 'grid', 'data-table', 'table-row', 'table-cell'],
    selectionCriteria: {},
    disambiguateFrom: {}
  },
  examples: []
});
