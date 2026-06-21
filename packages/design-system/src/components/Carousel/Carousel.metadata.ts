import { defineMetadata } from '../../metadata/schema.ts';

export const CarouselMetadata = defineMetadata({
  component: {
    name: 'Carousel',
    category: 'organism',
    description: 'A horizontal content slider with hardware-accelerated scroll snapping.',
    type: 'container',
    path: 'src/components/Carousel/Carousel.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'image-sliders',
      'testimonials-cards-carousel',
      'product-displays',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'standard-carousel',
        description: 'Exposes slide elements with arrow controls.',
        composition: `<Carousel>
  <CarouselContent>
    <CarouselItem>Slide 1</CarouselItem>
    <CarouselItem>Slide 2</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`,
      }
    ],
    antiPatterns: []
  },
  behavior: {
    states: [
      { name: 'idle', visual: 'Active slide snaps in view.' }
    ],
    interactions: [
      'Clicking arrows smooth-scrolls viewport to adjacent slides.'
    ],
    responsive: 'Slide item widths scale responsive to screen sizes.'
  },
  props: {},
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.border.subtle',
      'theme.shadow.sm'
    ]
  },
  accessibility: {
    role: 'region',
    keyboardSupport: 'Allows arrow navigation.',
    screenReader: 'Announces slides.',
    wcag: 'AA',
    notes: []
  },
  aiHints: {
    priority: 'medium',
    keywords: ['carousel', 'slider', 'slide-show', 'scroll-snap'],
    selectionCriteria: {},
    disambiguateFrom: {}
  },
  examples: []
});
