import { Radio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';

import { cx } from '../../utils/styleUtils';

import style from './RadioGroup.module.scss';

interface RadioGroupProps<T extends string | number | boolean> extends Omit<BaseRadioGroup.Props, 'onValueChange'> {
  items: {
    value: T;
    label: string;
  }[];
  onValueChange?: (value: T) => void;
  orientation?: 'horizontal' | 'vertical';
}

export default function RadioGroup<T extends string | number | boolean>({
  items,
  className,
  orientation = 'vertical',
  onValueChange,
  ...elementProps
}: RadioGroupProps<T>) {
  return (
    <BaseRadioGroup
      onValueChange={(value) => onValueChange?.(value as T)}
      className={cx([style.radioGroup, style[orientation], className])}
      {...elementProps}
    >
      {items.map((item) => (
        <label className={style.item} key={item.value.toString()}>
          <Radio.Root value={item.value.toString()} className={style.radio}>
            <Radio.Indicator className={style.indicator} />
          </Radio.Root>
          {item.label}
        </label>
      ))}
    </BaseRadioGroup>
  );
}
