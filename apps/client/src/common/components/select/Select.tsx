import { Select as BaseSelect } from '@base-ui/react/select';
import { CSSProperties, Fragment } from 'react';
import { IoCheckmark } from 'react-icons/io5';
import { LuChevronsUpDown } from 'react-icons/lu';

import { cx } from '../../utils/styleUtils';

import styles from './Select.module.scss';

export type SelectOption<T = string> = {
  value: T;
  label: string;
  disabled?: boolean;
  /** shows a dot of this colour before the label, an empty string keeps the space */
  colour?: string;
  /** consecutive options with the same group are listed under its label */
  group?: string;
};

type OptionGroup<T> = { label?: string; options: SelectOption<T>[] };

function groupOptions<T>(options: SelectOption<T>[]): OptionGroup<T>[] {
  const groups: OptionGroup<T>[] = [];
  for (const option of options) {
    const last = groups.at(-1);
    if (last && last.label === option.group) {
      last.options.push(option);
    } else {
      groups.push({ label: option.group, options: [option] });
    }
  }
  return groups;
}

interface SelectProps<T> extends Omit<BaseSelect.Root.Props<T>, 'items'> {
  options: SelectOption<T>[];
  fluid?: boolean;
  size?: 'medium' | 'large';
  'aria-label'?: string;
  /** where focus goes when the menu closes, the trigger by default */
  finalFocus?: BaseSelect.Popup.Props['finalFocus'];
  /** styles the trigger, eg: to blend in a table cell */
  triggerClassName?: string;
  triggerStyle?: CSSProperties;
  /** shown while no value is selected */
  placeholder?: string;
}

export default function Select<T>({
  options,
  fluid,
  size = 'medium',
  'aria-label': ariaLabel,
  finalFocus,
  triggerClassName,
  triggerStyle,
  placeholder,
  ...selectRootProps
}: SelectProps<T>) {
  const renderItem = ({ disabled, label, value, colour }: SelectOption<T>) => (
    <BaseSelect.Item key={String(value)} className={styles.item} value={value} disabled={disabled}>
      <BaseSelect.ItemIndicator className={styles.itemIndicator}>
        <IoCheckmark className={styles.itemIndicatorIcon} />
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText className={styles.itemLabel}>
        {colour !== undefined && <span className={styles.itemColour} style={{ backgroundColor: colour }} />}
        {label}
      </BaseSelect.ItemText>
    </BaseSelect.Item>
  );

  return (
    <BaseSelect.Root items={options} {...selectRootProps}>
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        className={cx([styles.select, styles[size], fluid && styles.fluid, triggerClassName])}
        style={triggerStyle}
      >
        <span className={styles.valueText}>
          <BaseSelect.Value placeholder={placeholder} />
        </span>
        <BaseSelect.Icon className={styles.selectIcon}>
          <LuChevronsUpDown />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner side='bottom' align='start'>
          <BaseSelect.ScrollUpArrow className={styles.scrollArrow} keepMounted />
          <BaseSelect.Popup className={styles.popup} finalFocus={finalFocus}>
            <BaseSelect.Arrow />
            <BaseSelect.List className={styles.list}>
              {groupOptions(options).map((group, index) =>
                group.label === undefined ? (
                  <Fragment key={index}>{group.options.map(renderItem)}</Fragment>
                ) : (
                  <BaseSelect.Group key={index}>
                    <BaseSelect.GroupLabel className={styles.groupLabel}>{group.label}</BaseSelect.GroupLabel>
                    {group.options.map(renderItem)}
                  </BaseSelect.Group>
                ),
              )}
            </BaseSelect.List>
          </BaseSelect.Popup>
          <BaseSelect.ScrollDownArrow className={styles.scrollArrow} keepMounted />
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
