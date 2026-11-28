import { Switch as BaseSwitch } from '@base-ui/react/switch';

import { cx } from '../../utils/styleUtils';

import style from './Switch.module.scss';

interface SwitchProps extends Omit<BaseSwitch.Root.Props, 'className'> {
  size?: 'medium' | 'large';
  className?: string;
}

export default function Switch({ size = 'medium', className, ...switchProps }: SwitchProps) {
  return (
    <BaseSwitch.Root className={cx([style.switch, style[size], className])} {...switchProps}>
      <BaseSwitch.Thumb className={style.thumb} />
    </BaseSwitch.Root>
  );
}
