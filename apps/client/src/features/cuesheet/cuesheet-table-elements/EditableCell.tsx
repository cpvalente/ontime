import { ChangeEvent, memo, useCallback, useEffect, useRef, useState } from 'react';
import { getHotkeyHandler } from '@mantine/hooks';

import { AutoTextArea } from '../../../common/components/input/auto-text-area/AutoTextArea';

interface EditableCellProps {
  value: string;
  handleUpdate: (newValue: string) => void;
}

const EditableCell = (props: EditableCellProps) => {
  const { value: initialValue, handleUpdate } = props;

  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLAreaElement>();
  const onChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value), []);

  // We'll only update the external data when the input is blurred
  const onBlur = useCallback(() => handleUpdate(value), [handleUpdate, value]);

  //TODO: maybe we can unify this with `useReactiveTextInput`
  const onKeyDown = getHotkeyHandler([
    ['ctrl + Enter', () => ref.current?.blur()],
    [
      'Escape',
      () => {
        setValue(initialValue);
        setTimeout(() => ref.current?.blur());
      },
    ],
  ]);

  // If the initialValue is changed external, sync it up with our state
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <AutoTextArea
      size='sm'
      value={value}
      inputref={ref}
      onChange={onChange}
      onBlur={onBlur}
      rows={1}
      onKeyDown={onKeyDown}
      transition='none'
      spellCheck={false}
      style={{ padding: 0 }}
    />
  );
};

export default memo(EditableCell);
