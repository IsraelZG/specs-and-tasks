import { useState } from 'react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  Button,
  Input,
  Label
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

type SheetSide = 'top' | 'bottom' | 'left' | 'right';

export default function SheetSection() {
  const sides: SheetSide[] = ['top', 'right', 'bottom', 'left'];
  const [name, setName] = useState('John Doe');
  const [username, setUsername] = useState('@john_doe');

  return (
    <SectionWrapper
      id="sheet"
      title="Sheet"
      overline="Component"
      description="A drawer component sliding from screen edges to display menus, forms, or settings details."
    >
      <Subsection title="Sheet Positions" stack>
        <div className="flex flex-wrap gap-3">
          {sides.map((side) => (
            <Sheet key={side}>
              <SheetTrigger asChild>
                <Button variant="secondary" className="capitalize">
                  Open {side}
                </Button>
              </SheetTrigger>
              <SheetContent side={side}>
                <SheetHeader>
                  <SheetTitle className="capitalize">Edit Profile ({side})</SheetTitle>
                  <SheetDescription>
                    Make changes to your profile settings here. Click save when you're done.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`${side}-name`} className="text-right">
                      Name
                    </Label>
                    <Input
                      id={`${side}-name`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`${side}-username`} className="text-right">
                      Username
                    </Label>
                    <Input
                      id={`${side}-username`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button type="submit">Save changes</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
