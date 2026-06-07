import { forwardRef, memo, useCallback, useImperativeHandle, useRef } from 'react';

import Input from '../../../../common/components/input/input/Input';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';

interface SingleLineCellProps {
  initialValue: string;
  fieldId?: string;
  fieldLabel?: string;
  allowSubmitSameValue?: boolean;
  submitOnTab?: boolean;
  handleUpdate: (newValue: string) => void;
  handleCancelUpdate?: () => void;
  handleTabCancel?: () => void;
}

const SingleLineCell = forwardRef(
  (
    {
      initialValue,
      fieldId,
      fieldLabel,
      allowSubmitSameValue,
      submitOnTab,
      handleUpdate,
      handleCancelUpdate,
      handleTabCancel,
    }: SingleLineCellProps,
    inputRef,
  ) => {
    const ref = useRef<HTMLInputElement | null>(null);
    const submitCallback = useCallback((newValue: string) => handleUpdate(newValue), [handleUpdate]);

    const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
      allowSubmitSameValue,
      allowKeyboardNavigation: true,
      submitOnEnter: true, // single line should submit on enter
      submitOnCtrlEnter: true,
      submitOnTab,
      onCancelUpdate: handleCancelUpdate,
      onTabCancel: handleTabCancel,
    });

    // expose a subset of the methods to the parent
    useImperativeHandle(inputRef, () => {
      return {
        focus() {
          ref.current?.focus();
        },
        select() {
          ref.current?.select();
        },
        focusParentElement() {
          ref.current?.parentElement?.focus();
        },
      };
    }, [ref]);

    return (
      <Input
        ref={ref}
        variant='ghosted'
        fluid
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        data-testid={fieldId ? `cuesheet-editor-${fieldId}` : undefined}
        aria-label={fieldLabel ? `${fieldLabel} editor` : undefined}
      />
    );
  },
);

SingleLineCell.displayName = 'SingleLineCell';

export default memo(SingleLineCell);
