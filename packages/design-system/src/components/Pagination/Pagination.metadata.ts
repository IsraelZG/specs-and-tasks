import { defineMetadata } from '../../metadata/schema.ts';

export const PaginationMetadata = defineMetadata({
  component: {
    name: 'Pagination',
    category: 'molecule',
    description: 'A navigation system segment that allows users to traverse paginated content lists.',
    type: 'interactive',
    path: 'src/components/Pagination/Pagination.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'table-result-pages-paging',
      'search-results-listing-navigation',
      'blog-archives-traversals',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'standard-pagination',
        description: 'Exposes page 1, active page 2, page 3, ellipsis, next/prev.',
        composition: `<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Pagination for simple wizard stepper pages.',
        reason: 'Pagination is optimized for large listings (like pages of tables/search). Steppers or Wizard flows should use dedicated multi-step indicators.',
        alternative: 'Use customized stepper configurations.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'active', visual: 'Active page number button has secondary button styling.' },
      { name: 'inactive', visual: 'Inactive numbers use simple hoverable ghost button styling.' }
    ],
    interactions: [
      'Clicking a page link takes user to that targeted page slice.'
    ],
    responsive: 'Pagers hide numeric items on small viewports and display only Prev/Next links.'
  },
  props: {},
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.surface.subdued',
      'theme.content.default',
      'theme.content.muted'
    ]
  },
  accessibility: {
    role: 'navigation',
    keyboardSupport: 'Focusable links using Tab, triggered via Space/Enter.',
    screenReader: 'Announces pagination container, active page index, link targets, and screen reader labels.',
    wcag: 'AAA',
    notes: [
      'Binds proper aria-labels and current page indicators.'
    ]
  },
  aiHints: {
    priority: 'medium',
    keywords: ['pagination', 'pager', 'pages-navigation', 'result-pages', 'pagination-link'],
    selectionCriteria: {
      'Do you need to paginate search results or database table rows?': 'Yes, use Pagination.'
    },
    disambiguateFrom: {
      Breadcrumb: 'Breadcrumbs show structural folder depth. Pagination navigates flat pages of content.'
    }
  },
  examples: [
    {
      name: 'simple-pager',
      description: 'Pagination list selection.',
      code: `<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
    <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext href="#" /></PaginationItem>
  </PaginationContent>
</Pagination>`
    }
  ]
});
