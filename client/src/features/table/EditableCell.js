import React, { useEffect, useState } from 'react';
import { AutoTextArea } from '../../common/input/AutoTextArea';

/**
 * Shamelessly copied from react-table docs
 * Plugged into chakra-ui editable component
 * @description Custom editable field for table component
 * @param initialValue
 * @param index
 * @param id
 * @param handleUpdate
 * @return {JSX.Element}
 * @constructor
 */
export default function EditableCell({
  value: initialValue,
  row: { index },
  column: { id },
  handleUpdate, // This is a custom function that we supplied to our table instance
}) {
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue);

  const onChange = (e) => {
    setValue(e.target.value);
  };

  // We'll only update the external data when the input is blurred
  const onBlur = () => {
    handleUpdate(index, id, value);
  };

  // If the initialValue is changed external, sync it up with our state
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <AutoTextArea
      size='sm'
      borderColor='#0001'
      defaultValue={value}
      onChange={onChange}
      onBlur={onBlur}
      rows={3}
      transition='none'
    />
  );
}
