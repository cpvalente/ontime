import { forwardRef, memo, useCallback, useImperativeHandle, useRef } from 'react';
import { Input, Text } from '@chakra-ui/react';

import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';

interface SingleLineCellProps {
  initialValue: string;
  allowSubmitSameValue?: boolean;
  allowEdits?: boolean;
  handleUpdate: (newValue: string) => void;
  handleCancelUpdate?: () => void;
}

const SingleLineCell = forwardRef((props: SingleLineCellProps, inputRef) => {
  const { initialValue, allowSubmitSameValue, handleUpdate, handleCancelUpdate, allowEdits } = props;
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback((newValue: string) => handleUpdate(newValue), [handleUpdate]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    allowSubmitSameValue,
    allowKeyboardNavigation: true,
    submitOnEnter: true, // single line should submit on enter
    submitOnCtrlEnter: true,
    onCancelUpdate: handleCancelUpdate,
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

  if (allowEdits === false) {
    return (
      <Text ref={ref} size='sm' variant='ontime-transparent' padding={0} fontSize='md'>
        {initialValue}
      </Text>
    );
  }

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
});

SingleLineCell.displayName = 'SingleLineCell';

export default memo(SingleLineCell);
