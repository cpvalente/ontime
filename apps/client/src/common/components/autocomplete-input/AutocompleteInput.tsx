import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import type { ReactNode, Ref } from 'react';
import { useEffect, useRef, useState } from 'react';

import { cx } from '../../utils/styleUtils';
import type { InputProps } from '../input/input/Input';
import { getScrollParent } from './autocompleteInput.utils';

import inputStyles from '../input/input/Input.module.scss';
import styles from './AutocompleteInput.module.scss';

export interface AutocompleteInputProps extends Omit<InputProps, 'value' | 'defaultValue' | 'onChange'> {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  emptyLabel?: string;
  trailingElement?: (option: string) => ReactNode;
  inputRef?: Ref<HTMLInputElement>;
  openOnFocus?: boolean;
}

export default function AutocompleteInput({
  className,
  disabled,
  emptyLabel,
  fluid,
  height = 'medium',
  inputRef,
  onValueChange,
  options,
  openOnFocus = false,
  trailingElement,
  value,
  variant = 'subtle',
  ...inputProps
}: AutocompleteInputProps) {
  const internalInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const { onFocus, ...restInputProps } = inputProps;

  const handleInputRef = (node: HTMLInputElement | null) => {
    internalInputRef.current = node;

    if (!inputRef) {
      return;
    }

    if (typeof inputRef === 'function') {
      inputRef(node);
      return;
    }

    inputRef.current = node;
  };

  // close the popover when the parent scrollable container scrolls or the window resizes
  useEffect(() => {
    if (!open) {
      return;
    }

    const scrollTarget = getScrollParent(internalInputRef.current);
    const handleScroll = () => setOpen(false);

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open]);

  return (
    <BaseAutocomplete.Root
      items={options}
      autoHighlight
      highlightItemOnHover
      disabled={disabled}
      open={open}
      value={value}
      onOpenChange={setOpen}
      onValueChange={onValueChange}
    >
      <BaseAutocomplete.Input
        ref={handleInputRef}
        onFocus={(event) => {
          onFocus?.(event);
          if (openOnFocus) {
            setOpen(true);
          }
        }}
        className={cx([
          inputStyles.input,
          inputStyles[variant],
          inputStyles[height],
          fluid && inputStyles.fluid,
          className,
        ])}
        {...restInputProps}
      />
      <BaseAutocomplete.Portal>
        <BaseAutocomplete.Positioner side='bottom' align='start' className={styles.positioner}>
          <BaseAutocomplete.Popup className={styles.popup} data-hide-empty={emptyLabel ? undefined : ''}>
            <BaseAutocomplete.List className={styles.list}>
              <BaseAutocomplete.Collection>
                {(option: string) => (
                  <BaseAutocomplete.Item key={option} value={option} className={styles.item}>
                    <span className={styles.itemLabel}>{option}</span>
                    {trailingElement?.(option)}
                  </BaseAutocomplete.Item>
                )}
              </BaseAutocomplete.Collection>
              {emptyLabel && <BaseAutocomplete.Empty className={styles.empty}>{emptyLabel}</BaseAutocomplete.Empty>}
            </BaseAutocomplete.List>
          </BaseAutocomplete.Popup>
        </BaseAutocomplete.Positioner>
      </BaseAutocomplete.Portal>
    </BaseAutocomplete.Root>
  );
}
