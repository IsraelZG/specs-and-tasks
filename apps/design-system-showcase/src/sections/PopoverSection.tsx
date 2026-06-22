import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent, Button, Input, Label } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function PopoverSection() {
  const [width, setWidth] = useState('100%');
  const [height, setHeight] = useState('auto');

  return (
    <SectionWrapper
      id="popover"
      title="Popover"
      overline="Component"
      description="A floating panel triggered by a button click, ideal for quick forms and details cards."
    >
      <Subsection title="Settings Popover Form" stack>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">Configure Layout</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm leading-none text-[color:var(--ds-theme-content-default)]">Dimensions</h4>
                  <p className="text-xs text-[color:var(--ds-theme-content-muted)]">
                    Configure the size of your display viewport.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 items-center gap-2">
                    <Label htmlFor="width" className="text-xs">Width</Label>
                    <Input
                      id="width"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="col-span-2 h-8 py-1 px-2 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <Label htmlFor="height" className="text-xs">Height</Label>
                    <Input
                      id="height"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="col-span-2 h-8 py-1 px-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="p-3 rounded-lg bg-[color:var(--ds-theme-surface-subdued)] border border-[color:var(--ds-theme-border-subtle)] text-xs font-mono text-[color:var(--ds-theme-content-muted)]">
            Width: {width} | Height: {height}
          </div>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
