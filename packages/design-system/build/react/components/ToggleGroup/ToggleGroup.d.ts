import { VariantProps } from 'class-variance-authority';
import { toggleVariants } from '../Toggle/Toggle';
import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
export type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>;
declare const ToggleGroup: React.ForwardRefExoticComponent<ToggleGroupProps & React.RefAttributes<HTMLDivElement>>;
export interface ToggleGroupItemProps extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>, VariantProps<typeof toggleVariants> {
}
declare const ToggleGroupItem: React.ForwardRefExoticComponent<ToggleGroupItemProps & React.RefAttributes<HTMLButtonElement>>;
export { ToggleGroup, ToggleGroupItem };
