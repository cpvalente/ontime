import { ChangeEvent, useCallback, useContext, useEffect, useState } from 'react';
import type { OntimeRundownEntry } from 'ontime-types';

import { AutoTextArea } from '../../../common/components/input/auto-text-area/AutoTextArea';
import { TableSettingsContext } from '../../../common/context/TableSettingsContext';

interface EditableCellProps {
  value: string;
  row: { index: number };
  column: { id: keyof OntimeRundownEntry };
  handleUpdate: (rowIndex: number, accessor: keyof OntimeRundownEntry, payload: unknown) => void;
}

/**
 * Shamelessly copied from react-table docs
 * Plugged into chakra-ui editable component
 * @description Custom editable field for table component
 * @param props
 * @return {JSX.Element}
 * @constructor
 */
export default function EditableCell(props: EditableCellProps) {
  const {
    value: initialValue,
    row: { index },
    column: { id },
    handleUpdate,
  } = props;
  const { theme } = useContext(TableSettingsContext);

  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue);

  const onChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value), []);

  // We'll only update the external data when the input is blurred
  const onBlur = useCallback(() => handleUpdate(index, id, value), [handleUpdate, id, index, value]);

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
      rows={3}
      transition='none'
      spellCheck={false}
      isDark={theme === 'dark'}
    />
  );
}

interface CuesheetEditableProps {
  value: string;
  handleUpdate: (newValue: string) => void;
}

export function CuesheetEditable(props: CuesheetEditableProps) {
  const { value: initialValue, handleUpdate } = props;
  const { theme } = useContext(TableSettingsContext);

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
      rows={3}
      transition='none'
      spellCheck={false}
      isDark={theme === 'dark'}
    />
  );
}
