import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
}
declare const Slider: React.ForwardRefExoticComponent<SliderProps & React.RefAttributes<HTMLSpanElement>>;
export { Slider };
