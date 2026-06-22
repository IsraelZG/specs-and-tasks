import * as React from 'react';
import { Calendar } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function CalendarSection() {
  const [date, setDate] = React.useState<Date>(() => new Date());

  return (
    <SectionWrapper
      id="calendar"
      title="Calendar"
      overline="Component"
      description="An interactive date selection calendar grid with navigation."
    >
      <Subsection title="Interactive Demo">
        <div className="flex flex-col items-center sm:items-start gap-4">
          <Calendar selected={date} onSelect={setDate} />
          <div className="text-xs text-[color:var(--ds-theme-content-muted)] mt-2">
            Selected Date: <span className="font-semibold text-[color:var(--ds-theme-content-default)]">{date?.toDateString()}</span>
          </div>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
