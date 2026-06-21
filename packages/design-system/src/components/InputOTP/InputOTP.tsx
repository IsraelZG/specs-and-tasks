import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputOTPProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ className, value, onChange, maxLength = 6, ...props }, ref) => {
    const inputRefs = React.useRef<HTMLInputElement[]>([]);

    const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (!/^\d*$/.test(val)) return;

      const digits = value.split('');
      digits[index] = val.slice(-1);

      const newValue = digits.join('').slice(0, maxLength);
      onChange(newValue);

      if (val && index < maxLength - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!value[index] && index > 0) {
          const digits = value.split('');
          digits[index - 1] = '';
          onChange(digits.join(''));
          inputRefs.current[index - 1]?.focus();
        } else {
          const digits = value.split('');
          digits[index] = '';
          onChange(digits.join(''));
        }
      }
    };

    const boxes = Array.from({ length: maxLength }, (_, i) => value[i] || '');

    return (
      <div ref={ref} className={cn('flex items-center gap-2', className)} {...props}>
        {boxes.map((digit, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            ref={(el) => {
              if (el) inputRefs.current[index] = el;
            }}
            onChange={(e) => { handleInputChange(index, e); }}
            onKeyDown={(e) => { handleKeyDown(index, e); }}
            className="w-10 h-12 text-center text-lg font-bold border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-focus-ring-color)] text-[color:var(--ds-theme-content-default)] transition-all"
          />
        ))}
      </div>
    );
  }
);

InputOTP.displayName = 'InputOTP';
