import { IoCheckmark } from 'react-icons/io5';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';

import style from './Checkbox.module.scss';

export default function Checkbox(checkboxProps: BaseCheckbox.Root.Props) {
  return (
    <BaseCheckbox.Root className={style.checkbox} {...checkboxProps}>
      <BaseCheckbox.Indicator className={style.indicator}>
        <IoCheckmark className={style.icon} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
