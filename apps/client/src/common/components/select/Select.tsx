import { IoCheckmark } from 'react-icons/io5';
import { LuChevronsUpDown } from 'react-icons/lu';
import { Select as BaseSelect } from '@base-ui-components/react/select';

import styles from './Select.module.scss';

interface SelectProps<T extends string | null = string> {
  defaultValue?: T;
  options: {
    value: NonNullable<T>;
    label: string;
    disabled?: boolean; // exposed to allow creating a non-selectable option
  }[];
  placeholder?: string;
  value?: T;
  onChange?: (value: NonNullable<T>) => void;
}

export default function Select<T extends string | null = string>({
  defaultValue,
  options,
  placeholder,
  value,
  onChange,
}: SelectProps<T>) {
  return (
    <BaseSelect.Root defaultValue={defaultValue} onValueChange={onChange} value={value}>
      <BaseSelect.Trigger className={styles.select}>
        <BaseSelect.Value placeholder={placeholder} />
        <BaseSelect.Icon className={styles.selectIcon}>
          <LuChevronsUpDown />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner side='bottom' align='start'>
          <BaseSelect.ScrollUpArrow className={styles.scrollArrow} />
          <BaseSelect.Popup className={styles.popup}>
            {options.map((option) => {
              return (
                <BaseSelect.Item key={option.value} className={styles.item} value={option.value}>
                  <BaseSelect.ItemIndicator className={styles.itemIndicator}>
                    <IoCheckmark className={styles.itemIndicatorIcon} />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className={styles.itemLabel}>{option.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              );
            })}
          </BaseSelect.Popup>
          <BaseSelect.ScrollDownArrow className={styles.scrollArrow} />
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
