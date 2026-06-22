import * as React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function CarouselSection() {
  return (
    <SectionWrapper
      id="carousel"
      title="Carousel"
      overline="Component"
      description="A horizontal content slider with hardware-accelerated scroll snapping."
    >
      <Subsection title="Interactive Demo">
        <div className="w-full max-w-md mx-auto relative px-12 py-4">
          <Carousel>
            <CarouselContent>
              {Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem key={index}>
                  <div className="flex h-48 items-center justify-center border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)]/40 rounded-2xl">
                    <span className="text-2xl font-bold text-[color:var(--ds-theme-content-default)]">
                      Slide {index + 1}
                    </span>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
