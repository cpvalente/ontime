import { memo, useCallback, useRef } from 'react';

import { AutoTextArea } from '../../../../common/components/input/auto-text-area/AutoTextArea';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';

interface MultiLineCellProps {
  initialValue: string;
  handleUpdate: (newValue: string) => void;
}

const MultiLineCell = (props: MultiLineCellProps) => {
  const { initialValue, handleUpdate } = props;
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback((newValue: string) => handleUpdate(newValue), [handleUpdate]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnCtrlEnter: true,
  });

  return (
    <AutoTextArea
      inputref={ref}
      rows={1}
      size='sm'
      padding={0}
      fontSize='1rem'
      transition='none'
      variant='ontime-transparent'
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      spellCheck={false}
    />
  );
};

export default memo(MultiLineCell);
