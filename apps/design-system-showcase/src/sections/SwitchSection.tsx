import { useState } from 'react';
import { Switch, Label, FormField } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function SwitchSection() {
  const [airplaneMode, setAirplaneMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);

  return (
    <SectionWrapper
      id="switch"
      title="Switch"
      overline="Component"
      description="A binary toggle switch control, modeled after Radix primitives and styled with design system tokens."
    >
      <Subsection title="States">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Unchecked</span>
            </div>
            <Switch />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Checked by default</span>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[color:var(--ds-theme-content-muted)]">Disabled Unchecked</span>
            </div>
            <Switch disabled />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[color:var(--ds-theme-content-muted)]">Disabled Checked</span>
            </div>
            <Switch disabled defaultChecked />
          </div>
        </div>
      </Subsection>

      <Subsection title="Label Composition" stack>
        <div className="flex flex-col gap-6 w-full max-w-sm">
          <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)]">
            <div className="flex flex-col gap-1">
              <Label htmlFor="airplane-mode" className="font-semibold cursor-pointer">
                Airplane Mode
              </Label>
              <span className="text-xs text-[color:var(--ds-theme-content-muted)]">
                Disable all wireless connections.
              </span>
            </div>
            <Switch
              id="airplane-mode"
              checked={airplaneMode}
              onCheckedChange={setAirplaneMode}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)]">
            <div className="flex flex-col gap-1">
              <Label htmlFor="notifications-toggle" className="font-semibold cursor-pointer">
                Push Notifications
              </Label>
              <span className="text-xs text-[color:var(--ds-theme-content-muted)]">
                Receive real-time alerts.
              </span>
            </div>
            <Switch
              id="notifications-toggle"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
        </div>
      </Subsection>

      <Subsection title="Form Field Integration" stack>
        <div className="flex flex-col gap-6 w-full max-w-sm">
          <FormField
            label="Marketing Emails"
            helpText="Receive newsletters and promotional offers from our team."
          >
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="marketing-emails"
                checked={marketing}
                onCheckedChange={setMarketing}
              />
              <Label htmlFor="marketing-emails" className="text-xs text-[color:var(--ds-theme-content-muted)] cursor-pointer">
                I agree to the terms
              </Label>
            </div>
          </FormField>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
