import { memo, useCallback, useRef } from 'react';

import { AutoTextarea } from '../../../../common/components/input/auto-textarea/AutoTextarea';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';

interface MultiLineCellProps {
  initialValue: string;
  handleUpdate: (newValue: string) => void;
}

export default memo(MultiLineCell);

function MultiLineCell({ initialValue, handleUpdate }: MultiLineCellProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const submitCallback = useCallback((newValue: string) => handleUpdate(newValue), [handleUpdate]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnCtrlEnter: true,
    allowKeyboardNavigation: true,
  });

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
    />
  );
}
