import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function BreadcrumbSection() {
  return (
    <SectionWrapper
      id="breadcrumb"
      title="Breadcrumb"
      overline="Component"
      description="A navigation aid displaying hierarchical links showing page locations."
    >
      <Subsection title="Standard Path trail" stack>
        <div className="p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)]">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#home">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#docs">Docs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#components">Components</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </Subsection>

      <Subsection title="Collapsed Path trail" stack>
        <div className="p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)]">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#home">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#components">Components</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
