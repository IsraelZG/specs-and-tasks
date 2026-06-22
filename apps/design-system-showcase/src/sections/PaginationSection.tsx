import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function PaginationSection() {
  return (
    <SectionWrapper
      id="pagination"
      title="Pagination"
      overline="Component"
      description="A paginator component offering controls to browse paginated data lists."
    >
      <Subsection title="Paginator Setup" stack>
        <div className="p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)]">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#prev" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#page-1">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#page-2" isActive>2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#page-3">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#next" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
