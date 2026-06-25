import { Skeleton } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function SkeletonSection() {
  return (
    <SectionWrapper
      id="skeleton"
      title="Skeleton"
      overline="Component"
      description="Visual loading placeholders to show layout silhouettes while async operations finish."
    >
      <Subsection title="Card Loading Skeleton" stack>
        <div className="flex items-center space-x-4 w-full max-w-sm p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)]">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="space-y-2 w-full">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Subsection>

      <Subsection title="Rich Feed Content Skeleton" stack>
        <div className="w-full max-w-md p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5 w-1/3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2.5 w-2/3" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
