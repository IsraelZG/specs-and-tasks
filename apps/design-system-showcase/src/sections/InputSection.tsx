import { useState } from 'react';
import { Input, FormField } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M1.5 5L8 9L14.5 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export default function InputSection() {
  const [values, setValues] = useState({
    basic: '',
    email: '',
    search: '',
    username: 'bad-user!!',
    sm: '',
    md: '',
    lg: '',
  });

  const update = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues(v => ({ ...v, [key]: e.target.value }));

  return (
    <SectionWrapper
      id="input"
      title="Input"
      overline="Component"
      description="Single-line text control. Always pair with a visible label — never rely on placeholder alone."
    >
      <Subsection title="With labels and context" stack>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <FormField label="Full name" htmlFor="input-name">
            <Input id="input-name" value={values.basic} onChange={update('basic')} placeholder="Jane Smith" />
          </FormField>

          <FormField label="Email address" htmlFor="input-email">
            <Input
              id="input-email"
              value={values.email}
              onChange={update('email')}
              placeholder="you@company.com"
              leadingIcon={<MailIcon />}
              type="email"
            />
          </FormField>

          <FormField label="Search" htmlFor="input-search">
            <Input
              id="input-search"
              value={values.search}
              onChange={update('search')}
              placeholder="Search components…"
              trailingIcon={<SearchIcon />}
            />
          </FormField>

          <FormField
            label="Username"
            htmlFor="input-username"
            errorText="Only letters, numbers, and underscores. 3–20 characters."
          >
            <Input
              id="input-username"
              value={values.username}
              onChange={update('username')}
              invalid
              placeholder="your_username"
            />
          </FormField>

          <FormField label="Read-only" htmlFor="input-readonly" helpText="This value is managed by your SSO provider.">
            <Input id="input-readonly" value="israel.gianesini" onChange={() => {}} readOnly />
          </FormField>

          <Input value="Disabled field" onChange={() => {}} disabled />
        </div>
      </Subsection>

      <Subsection title="Sizes" stack>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Input value={values.sm} onChange={update('sm')} size="sm" placeholder="Small (32px)" />
          <Input value={values.md} onChange={update('md')} size="md" placeholder="Medium — default (40px)" />
          <Input value={values.lg} onChange={update('lg')} size="lg" placeholder="Large (48px)" />
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
