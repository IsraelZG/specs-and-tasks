import * as React from 'react';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function MenubarSection() {
  return (
    <SectionWrapper
      id="menubar"
      title="Menubar"
      overline="Component"
      description="A horizontal menu bar displaying drop-down action lists (e.g. desktop app headers)."
    >
      <Subsection title="Interactive Demo">
        <div className="w-full max-w-lg">
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => alert('New Tab clicked!')}>
                  New Tab <MenubarShortcut>⌘T</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={() => alert('New Window clicked!')}>
                  New Window <MenubarShortcut>⌘N</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => alert('Share clicked!')}>Share</MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => alert('Print clicked!')}>
                  Print <MenubarShortcut>⌘P</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger>Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => alert('Undo clicked!')}>
                  Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={() => alert('Redo clicked!')}>
                  Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => alert('Cut clicked!')}>Cut</MenubarItem>
                <MenubarItem onClick={() => alert('Copy clicked!')}>Copy</MenubarItem>
                <MenubarItem onClick={() => alert('Paste clicked!')}>Paste</MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => alert('Always Show Bookmarks Bar clicked!')}>
                  Always Show Bookmarks Bar
                </MenubarItem>
                <MenubarItem onClick={() => alert('Always Show Full URL clicked!')}>
                  Always Show Full URL
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => alert('Reload clicked!')}>
                  Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
