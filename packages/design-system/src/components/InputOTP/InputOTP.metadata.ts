import { defineMetadata } from '../../metadata/schema.ts';

export const InputOTPMetadata = defineMetadata({
  component: {
    name: 'InputOTP',
    category: 'molecule',
    description: 'A component with individual digit entry fields for security codes and one-time passwords.',
    type: 'interactive',
    path: 'src/components/InputOTP/InputOTP.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'one-time-password-verification',
      'two-factor-auth-screens',
      'pin-code-inputs',
    ],
    requiredProps: ['value', 'onChange'],
    commonPatterns: [
      {
        name: 'controlled-otp',
        description: 'Exposes 6 digit OTP values.',
        composition: `const [otp, setOtp] = useState('');
<InputOTP value={otp} onChange={setOtp} />`,
      }
    ],
    antiPatterns: []
  },
  behavior: {
    states: [
      { name: 'focused-digit', visual: 'Highlights active input box boundary with focus ring.' }
    ],
    interactions: [
      'Filling a digit jumps focus to adjacent right box.',
      'Pressing backspace moves focus to adjacent left box.'
    ],
    responsive: 'Paddings and spacings adapt easily to narrow mobile viewports.'
  },
  props: {
    value: { type: 'string', required: true, description: 'The OTP code string value.' },
    onChange: { type: '(value: string) => void', required: true, description: 'Callback fired on digit changes.' },
    maxLength: { type: 'number', default: '6', required: false, description: 'Total count of digit input boxes.' }
  },
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.border.subtle',
      'theme.content.default',
      'focusRing.{width,offset,color,shadow}'
    ]
  },
  accessibility: {
    role: 'textbox',
    keyboardSupport: 'Standard digit entry, Backspace navigates left/right.',
    screenReader: 'Reads input digit values.',
    wcag: 'AA',
    notes: []
  },
  aiHints: {
    priority: 'medium',
    keywords: ['otp-input', 'one-time-password', '2fa-field', 'security-pin'],
    selectionCriteria: {},
    disambiguateFrom: {}
  },
  examples: []
});
