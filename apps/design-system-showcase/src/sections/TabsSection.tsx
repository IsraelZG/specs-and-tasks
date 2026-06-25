import { useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  Input,
  Label
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function TabsSection() {
  const [name, setName] = useState('Israel Z. G.');
  const [email, setEmail] = useState('israel@example.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  return (
    <SectionWrapper
      id="tabs"
      title="Tabs"
      overline="Component"
      description="Organizes content views in a tabbed panel interface."
    >
      <Subsection title="Account Configuration Panel" stack>
        <div className="w-full max-w-md">
          <Tabs defaultValue="account">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="account">Account Details</TabsTrigger>
              <TabsTrigger value="password">Password Setup</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <div className="border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] rounded-xl p-6 mt-3 space-y-4 shadow-[var(--ds-theme-shadow-sm)]">
                <div className="space-y-1">
                  <h4 className="text-base font-semibold">Account Info</h4>
                  <p className="text-xs text-[color:var(--ds-theme-content-muted)]">Update your profile parameters here.</p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="tab-name">Name</Label>
                    <Input id="tab-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tab-email">Email</Label>
                    <Input id="tab-email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <Button>Save Settings</Button>
              </div>
            </TabsContent>
            <TabsContent value="password">
              <div className="border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] rounded-xl p-6 mt-3 space-y-4 shadow-[var(--ds-theme-shadow-sm)]">
                <div className="space-y-1">
                  <h4 className="text-base font-semibold">Security Settings</h4>
                  <p className="text-xs text-[color:var(--ds-theme-content-muted)]">Configure and rotate your login passwords.</p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="tab-curr-pass">Current Password</Label>
                    <Input
                      id="tab-curr-pass"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tab-new-pass">New Password</Label>
                    <Input
                      id="tab-new-pass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="secondary">Reset Password</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
