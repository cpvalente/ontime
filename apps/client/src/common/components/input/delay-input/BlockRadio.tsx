import { Radio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';

import style from './BlockRadio.module.scss';

interface BlockRadioProps<T extends string | number | boolean> extends Omit<BaseRadioGroup.Props, 'onValueChange'> {
  items: {
    value: T;
    label: string;
  }[];
  onValueChange?: (value: T) => void;
}

export default function BlockRadio<T extends string | number | boolean>({
  items,
  onValueChange,
  ...elementProps
}: BlockRadioProps<T>) {
  return (
    <BaseRadioGroup
      onValueChange={(value) => onValueChange?.(value as T)}
      className={style.radioGroup}
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
