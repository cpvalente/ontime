import { IoCheckmark } from 'react-icons/io5';
import { LuChevronsUpDown } from 'react-icons/lu';
import { Select as BaseSelect } from '@base-ui-components/react/select';

import styles from './Select.module.scss';

interface SelectProps<T> extends Omit<BaseSelect.Root.Props<T>, 'items'> {
  // overload items to not allow undefined values
  options: {
    value: T;
    label: string;
  }[];
}

export default function Select<T>({ options, ...selectRootProps }: SelectProps<T>) {
  return (
    <BaseSelect.Root items={options} {...selectRootProps}>
      <BaseSelect.Trigger className={styles.select}>
        <BaseSelect.Value />
        <BaseSelect.Icon className={styles.selectIcon}>
          <LuChevronsUpDown />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner side='bottom' align='start'>
          <BaseSelect.ScrollUpArrow className={styles.scrollArrow} />
          <BaseSelect.Popup className={styles.popup}>
            {options.map(({ label, value }) => (
              <BaseSelect.Item key={String(value)} className={styles.item} value={value}>
                <BaseSelect.ItemIndicator className={styles.itemIndicator}>
                  <IoCheckmark className={styles.itemIndicatorIcon} />
                </BaseSelect.ItemIndicator>
                <BaseSelect.ItemText className={styles.itemLabel}>{label}</BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
          <BaseSelect.ScrollDownArrow className={styles.scrollArrow} />
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
