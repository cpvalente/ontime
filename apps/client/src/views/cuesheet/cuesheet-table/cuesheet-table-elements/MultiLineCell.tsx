import { forwardRef, memo, useCallback, useImperativeHandle, useRef } from 'react';

import { AutoTextarea } from '../../../../common/components/input/auto-textarea/AutoTextarea';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';

interface MultiLineCellProps {
  initialValue: string;
  fieldId?: string;
  fieldLabel?: string;
  handleUpdate: (newValue: string) => void;
  handleCancelUpdate?: () => void;
}

const MultiLineCell = forwardRef(function MultiLineCell(
  { initialValue, fieldId, fieldLabel, handleUpdate, handleCancelUpdate }: MultiLineCellProps,
  inputRef,
) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const submitCallback = useCallback((newValue: string) => handleUpdate(newValue), [handleUpdate]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnCtrlEnter: true,
    allowKeyboardNavigation: true,
    onCancelUpdate: handleCancelUpdate,
  });

  // expose focus to the parent so the editor can be focused when mounted on demand
  useImperativeHandle(
    inputRef,
    () => ({
      focus() {
        ref.current?.focus();
      },
      select() {
        ref.current?.select();
      },
    }),
    [ref],
  );

  return (
    <AutoTextarea
      inputref={ref}
      variant='ghosted'
      fluid
      rows={1}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      spellCheck={false}
      data-testid={fieldId ? `cuesheet-editor-${fieldId}` : undefined}
      aria-label={fieldLabel ? `${fieldLabel} editor` : undefined}
    />
  );
});

export default memo(MultiLineCell);
