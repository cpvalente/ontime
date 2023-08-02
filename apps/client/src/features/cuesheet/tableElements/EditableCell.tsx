import { ChangeEvent, memo, useCallback, useEffect, useState } from 'react';

import { AutoTextArea } from '../../../common/components/input/auto-text-area/AutoTextArea';

interface EditableCellProps {
  value: string;
  handleUpdate: (newValue: string) => void;
}

const EditableCell = (props: EditableCellProps) => {
  const { value: initialValue, handleUpdate } = props;

  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue);

  const onChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value), []);

  // We'll only update the external data when the input is blurred
  const onBlur = useCallback(() => handleUpdate(value), [handleUpdate, value]);

  // If the initialValue is changed external, sync it up with our state
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <AutoTextArea
      size='sm'
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      rows={1}
      transition='none'
      spellCheck={false}
      style={{ padding: 0 }}
    />
  );
};

export default memo(EditableCell);
