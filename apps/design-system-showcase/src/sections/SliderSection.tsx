import { useState } from 'react';
import { Slider, Label, FormField } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function SliderSection() {
  const [volume, setVolume] = useState([50]);
  const [priceRange, setPriceRange] = useState([20, 80]);
  const [brightness, setBrightness] = useState([70]);
  const [disabledVal] = useState([40]);

  return (
    <SectionWrapper
      id="slider"
      title="Slider"
      overline="Component"
      description="An input where the user selects a single value or range of values by dragging one or more thumbs on a horizontal track."
    >
      <Subsection title="Single Value Slider" stack>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <div className="flex items-center justify-between">
            <Label htmlFor="volume-slider">Volume Control</Label>
            <span className="text-sm font-semibold tabular-nums">{volume[0]}%</span>
          </div>
          <Slider
            id="volume-slider"
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
          />
        </div>
      </Subsection>

      <Subsection title="Dual Handle Range Slider" stack>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <div className="flex items-center justify-between">
            <Label htmlFor="price-slider">Price Range Filter</Label>
            <span className="text-sm font-semibold tabular-nums">
              ${priceRange[0]} - ${priceRange[1]}
            </span>
          </div>
          <Slider
            id="price-slider"
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </Subsection>

      <Subsection title="Stepped Slider" stack>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <div className="flex items-center justify-between">
            <Label htmlFor="brightness-slider">Screen Brightness (Steps of 10)</Label>
            <span className="text-sm font-semibold tabular-nums">{brightness[0]}%</span>
          </div>
          <Slider
            id="brightness-slider"
            value={brightness}
            onValueChange={setBrightness}
            max={100}
            step={10}
          />
        </div>
      </Subsection>

      <Subsection title="Disabled Slider" stack>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <div className="flex items-center justify-between text-[color:var(--ds-theme-content-muted)]">
            <Label htmlFor="disabled-slider" disabled>System Level Adjuster</Label>
            <span className="text-sm font-semibold tabular-nums">{disabledVal[0]}%</span>
          </div>
          <Slider
            id="disabled-slider"
            value={disabledVal}
            disabled
          />
        </div>
      </Subsection>

      <Subsection title="Form Field Composition" stack>
        <div className="w-full max-w-sm">
          <FormField
            label="Contrast Adjuster"
            helpText="Higher contrast enhances legibility but reduces color accuracy."
          >
            <div className="pt-2">
              <Slider
                defaultValue={[60]}
                max={100}
              />
            </div>
          </FormField>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
