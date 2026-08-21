import { ComponentProps } from 'react';

import Button from './Button';

type ToggleButtonProps = Omit<ComponentProps<typeof Button>, 'variant'> & {
  /** whether the option this button controls is currently on */
  pressed: boolean;
};

/**
 * A button which carries an on / off state.
 *
 * Keeps the pressed styling and the accessible state together, so that a toggle
 * cannot end up looking active without also announcing that it is.
 */
export default function ToggleButton({ pressed, ...buttonProps }: ToggleButtonProps) {
  return <Button variant={pressed ? 'primary' : 'subtle'} aria-pressed={pressed} {...buttonProps} />;
}
