import * as React from 'react';
import { InputOTP } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function InputOTPSection() {
  const [value, setValue] = React.useState('');

  return (
    <SectionWrapper
      id="inputotp"
      title="Input OTP"
      overline="Component"
      description="A component with individual digit entry fields for security codes and one-time passwords."
    >
      <Subsection title="Interactive Demo">
        <div className="space-y-4">
          <InputOTP value={value} onChange={setValue} maxLength={6} />
          <div className="text-xs text-[color:var(--ds-theme-content-muted)]">
            Entered Code: <span className="font-semibold text-[color:var(--ds-theme-content-default)]">{value || 'None'}</span>
          </div>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
