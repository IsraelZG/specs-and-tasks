import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>;
declare const Switch: React.ForwardRefExoticComponent<Omit<SwitchPrimitives.SwitchProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export { Switch };
