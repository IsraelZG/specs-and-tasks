import * as React from 'react';
import {
  Button,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function CommandSection() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <SectionWrapper
      id="command"
      title="Command"
      overline="Component"
      description="A modal command palette allowing search-based executable items and shortcuts."
    >
      <Subsection title="Interactive Demo">
        <div className="space-y-4">
          <Button onClick={() => setOpen(true)} className="cursor-pointer">
            Open Command Palette (Ctrl+K)
          </Button>

          <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandGroup heading="Suggestions">
                <CommandItem onSelect={() => { alert('Calendar triggered!'); setOpen(false); }}>
                  <span>Calendar</span>
                  <CommandShortcut>⌘C</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => { alert('Search Emoji triggered!'); setOpen(false); }}>
                  <span>Search Emoji</span>
                  <CommandShortcut>⌘E</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => { alert('Calculator triggered!'); setOpen(false); }}>
                  <span>Calculator</span>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Settings">
                <CommandItem onSelect={() => { alert('Profile Settings triggered!'); setOpen(false); }}>
                  <span>Profile</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => { alert('Billing Settings triggered!'); setOpen(false); }}>
                  <span>Billing</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
