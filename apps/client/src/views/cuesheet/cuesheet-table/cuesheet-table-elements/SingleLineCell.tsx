import { memo, useCallback, useRef } from 'react';
import { Input } from '@chakra-ui/react';

import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';

interface SingleLineCellProps {
  initialValue: string;
  handleUpdate: (newValue: string) => void;
}

export default memo(SingleLineCell);

function SingleLineCell(props: SingleLineCellProps) {
  const { initialValue, handleUpdate } = props;
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback((newValue: string) => handleUpdate(newValue), [handleUpdate]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnCtrlEnter: true,
  });

  return (
    <Input
      ref={ref}
      size='sm'
      variant='ontime-transparent'
      padding={0}
      fontSize='md'
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      spellCheck={false}
      autoComplete='off'
    />
  );
}
