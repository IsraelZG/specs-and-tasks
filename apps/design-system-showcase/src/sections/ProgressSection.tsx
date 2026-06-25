import * as React from 'react';
import { Progress } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function ProgressSection() {
  const [value, setValue] = React.useState(33);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setValue((prev) => (prev >= 100 ? 10 : prev + 10));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <SectionWrapper
      id="progress"
      title="Progress"
      overline="Component"
      description="A visual progress bar displaying numeric completeness states."
    >
      <Subsection title="Interactive Demo">
        <div className="w-full max-w-md space-y-4">
          <Progress value={value} />
          <div className="text-xs text-[color:var(--ds-theme-content-muted)]">
            Progress value: <span className="font-semibold text-[color:var(--ds-theme-content-default)]">{value}%</span>
          </div>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
