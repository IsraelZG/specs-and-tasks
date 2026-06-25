import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuRadioGroup,
  Button
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function DropdownMenuSection() {
  const [showStatus, setShowStatus] = useState(true);
  const [showActivity, setShowActivity] = useState(false);
  const [role, setRole] = useState('developer');

  return (
    <SectionWrapper
      id="dropdownmenu"
      title="Dropdown Menu"
      overline="Component"
      description="Contextual overlays presenting menus of actions, submenus, checklist toggles, or navigation options."
    >
      <Subsection title="Full Action Menu & Submenus" stack>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">Open Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Billing
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Team Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Invite Users</DropdownMenuItem>
              <DropdownMenuItem disabled>New Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[color:var(--ds-theme-content-danger)] hover:bg-[color:var(--ds-theme-surface-subdued)]">
                Log out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Subsection>

      <Subsection title="Checkboxes & Radio Items" stack>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">Filter Options</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Toggle Indicators</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showStatus}
                onCheckedChange={setShowStatus}
              >
                Show Status Bar
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showActivity}
                onCheckedChange={setShowActivity}
              >
                Show Activity Log
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Role Selection</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={role} onValueChange={setRole}>
                <DropdownMenuRadioItem value="admin">Administrator</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="developer">Developer</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="designer">Designer</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-xs font-mono text-[color:var(--ds-theme-content-muted)] bg-[color:var(--ds-theme-surface-subdued)] p-3 rounded-lg border border-[color:var(--ds-theme-border-subtle)] space-y-1">
            <div>Status bar: {showStatus ? 'Visible' : 'Hidden'}</div>
            <div>Activity log: {showActivity ? 'Visible' : 'Hidden'}</div>
            <div>Selected Role: {role}</div>
          </div>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
