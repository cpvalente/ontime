import { Switch as BaseSwitch } from '@base-ui/react/switch';

import { cx } from '../../utils/styleUtils';

import style from './Switch.module.scss';

interface SwitchProps extends BaseSwitch.Root.Props {
  size?: 'medium' | 'large';
  /** the switch represents several values which do not agree, we hide the thumb */
  mixed?: boolean;
}

export default function Switch({ size = 'medium', mixed, ...switchProps }: SwitchProps) {
  return (
    <BaseSwitch.Root className={cx([style.switch, style[size], mixed && style.mixed])} {...switchProps}>
      <BaseSwitch.Thumb className={style.thumb} />
    </BaseSwitch.Root>
  );
}
