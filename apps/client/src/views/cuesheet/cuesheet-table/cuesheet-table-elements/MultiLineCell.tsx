import { memo, useCallback, useRef } from 'react';

import { AutoTextArea } from '../../../../common/components/input/auto-text-area/AutoTextArea';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';

interface MultiLineCellProps {
  initialValue: string;
  handleUpdate: (newValue: string) => void;
  allowEdits?: boolean;
}

export default memo(MultiLineCell);

function MultiLineCell(props: MultiLineCellProps) {
  const { initialValue, handleUpdate, allowEdits } = props;
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback((newValue: string) => handleUpdate(newValue), [handleUpdate]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnCtrlEnter: true,
    allowKeyboardNavigation: true,
  });

  return (
    <AutoTextArea
      inputref={ref}
      rows={1}
      size='sm'
      style={{
        minHeight: '2rem',
        padding: '0',
        paddingTop: '0.25rem',
        fontSize: '1rem',
      }}
      transition='none'
      variant='ontime-transparent'
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      spellCheck={false}
      isDisabled={!allowEdits}
    />
  );
}
