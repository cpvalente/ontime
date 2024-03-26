import { type KeyboardEvent, ChangeEvent, memo, useCallback, useEffect, useRef, useState } from 'react';

import { AutoTextArea } from '../../../common/components/input/auto-text-area/AutoTextArea';

interface EditableCellProps {
  value: string;
  handleUpdate: (newValue: string) => void;
}

const EditableCell = (props: EditableCellProps) => {
  const { value: initialValue, handleUpdate } = props;
  const inputRef = useRef<unknown>(null);
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue);

  const onChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value), []);

  // We'll only update the external data when the input is blurred
  const onBlur = useCallback(() => handleUpdate(value), [handleUpdate, value]);
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key == 'Escape') {
      setValue(initialValue);
      const elm = inputRef?.current as HTMLElement;
      setTimeout(() => elm.blur());
      event.stopPropagation();
    }
  };

  // If the initialValue is changed external, sync it up with our state
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <AutoTextArea
      inputRef={inputRef}
      size='sm'
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={(event) => onKeyDown(event)}
      rows={1}
      transition='none'
      spellCheck={false}
      style={{ padding: 0 }}
    />
  );
};

export default memo(EditableCell);
