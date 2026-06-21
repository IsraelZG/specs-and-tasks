import * as React from 'react';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../Button/Button';

type CarouselContextProps = {
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }
  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(true);

  const checkScroll = React.useCallback(() => {
    const el = containerRef.current;
    if (el) {
      setCanScrollPrev(el.scrollLeft > 0);
      setCanScrollNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }
  }, []);

  const scrollPrev = React.useCallback(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
    }
  }, []);

  const scrollNext = React.useCallback(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
    }
  }, []);

  React.useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  return (
    <CarouselContext.Provider
      value={{
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        ref={ref}
        className={cn('relative w-full overflow-hidden', className)}
        {...props}
      >
        <div
          ref={containerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none scrollbar-hide"
        >
          {children}
        </div>
      </div>
    </CarouselContext.Provider>
  );
});
Carousel.displayName = 'Carousel';

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex w-full', className)}
    {...props}
  />
));
CarouselContent.displayName = 'CarouselContent';

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'min-w-0 shrink-0 grow-0 basis-full snap-start pl-4',
      className
    )}
    {...props}
  />
));
CarouselItem.displayName = 'CarouselItem';

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel();

  return (
    <button
      ref={ref}
      type="button"
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] shadow-[var(--ds-theme-shadow-sm)] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none z-10 text-xs font-bold text-[color:var(--ds-theme-content-default)]',
        className
      )}
      {...props}
    >
      ◀
    </button>
  );
});
CarouselPrevious.displayName = 'CarouselPrevious';

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <button
      ref={ref}
      type="button"
      onClick={scrollNext}
      disabled={!canScrollNext}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] shadow-[var(--ds-theme-shadow-sm)] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none z-10 text-xs font-bold text-[color:var(--ds-theme-content-default)]',
        className
      )}
      {...props}
    >
      ▶
    </button>
  );
});
CarouselNext.displayName = 'CarouselNext';

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
