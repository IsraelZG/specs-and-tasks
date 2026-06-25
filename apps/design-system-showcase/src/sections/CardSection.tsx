import { Card, Avatar, Badge } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

function ProfileCard() {
  return (
    <Card padding="md" className="w-60">
      <div className="flex items-center gap-3 mb-3">
        <Avatar fallback="MR" size="md" />
        <div>
          <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[color:var(--ds-theme-content-strong)]">
            Mariana Rodrigues
          </p>
          <p className="text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)]">
            Product Designer
          </p>
        </div>
      </div>
      <Badge intent="success">Active</Badge>
    </Card>
  );
}

function StatsCard() {
  return (
    <Card padding="md" className="w-52">
      <p className="text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-subtle)] mb-1">
        Monthly Revenue
      </p>
      <p className="text-[length:var(--ds-font-size-2xl)] font-[var(--ds-font-weight-bold)] text-[color:var(--ds-theme-content-strong)]">
        $24,890
      </p>
      <p className="text-[length:var(--ds-font-size-xs)] mt-1 text-[color:var(--ds-theme-intent-success-strong)]">
        ↑ 12% vs last month
      </p>
    </Card>
  );
}

function TaskCard({ label }: { label: string }) {
  return (
    <div>
      <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[color:var(--ds-theme-content-strong)] mb-1">
        {label}
      </p>
      <p className="text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)]">
        Review component tokens and update metadata.
      </p>
    </div>
  );
}

export default function CardSection() {
  return (
    <SectionWrapper
      id="card"
      title="Card"
      overline="Component"
      description="Surface that groups related content. Interactive cards require as='button' or as='a' — never div + onClick."
    >
      <Subsection title="Content examples">
        <ProfileCard />
        <StatsCard />
      </Subsection>

      <Subsection title="Padding variants">
        {(['none', 'sm', 'md', 'lg'] as const).map(padding => (
          <div key={padding}>
            <p className="text-[length:var(--ds-font-size-xs)] mb-2 text-[color:var(--ds-theme-content-subtle)]">
              {padding}
            </p>
            <Card padding={padding} className="w-48">
              <TaskCard label={`padding="${padding}"`} />
            </Card>
          </div>
        ))}
      </Subsection>

      <Subsection title="Interactive">
        <div>
          <p className="text-[length:var(--ds-font-size-xs)] mb-2 text-[color:var(--ds-theme-content-subtle)]">
            as="button"
          </p>
          <Card as="button" interactive onClick={() => alert('Card clicked!')} className="w-52">
            <TaskCard label="Interactive card" />
          </Card>
        </div>
        <div>
          <p className="text-[length:var(--ds-font-size-xs)] mb-2 text-[color:var(--ds-theme-content-subtle)]">
            as="a"
          </p>
          <Card as="a" interactive href="#card" className="w-52">
            <TaskCard label="Link card" />
          </Card>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
