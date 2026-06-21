import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
declare const toggleVariants: (props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
export interface ToggleProps extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>, VariantProps<typeof toggleVariants> {
}
declare const Toggle: React.ForwardRefExoticComponent<ToggleProps & React.RefAttributes<HTMLButtonElement>>;
export { Toggle, toggleVariants };
