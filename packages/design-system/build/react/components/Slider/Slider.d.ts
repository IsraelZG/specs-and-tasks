import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
export type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;
declare const Slider: React.ForwardRefExoticComponent<Omit<SliderPrimitive.SliderProps & React.RefAttributes<HTMLSpanElement>, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export { Slider };
