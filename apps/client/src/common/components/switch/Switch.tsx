import { Switch as BaseSwitch } from '@base-ui/react/switch';

import { cx } from '../../utils/styleUtils';

import style from './Switch.module.scss';

interface SwitchProps extends BaseSwitch.Root.Props {
  size?: 'medium' | 'large';
  indeterminate?: boolean;
}

export default function Switch({ size = 'medium', indeterminate, ...switchProps }: SwitchProps) {
  return (
    <BaseSwitch.Root
      className={cx([style.switch, style[size], indeterminate && style.indeterminate])}
      {...switchProps}
    >
      <BaseSwitch.Thumb className={style.thumb} />
    </BaseSwitch.Root>
  );
}
