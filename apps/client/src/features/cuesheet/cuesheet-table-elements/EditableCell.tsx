import { ChangeEvent, memo, useCallback, useEffect, useRef, useState } from 'react';
import { getHotkeyHandler } from '@mantine/hooks';

import { AutoTextArea } from '../../../common/components/input/auto-text-area/AutoTextArea';
import MarkdownArea from '../../../common/components/input/markdown/MarkdownArea';

interface EditableCellProps {
  value: string;
  isMarkdown?: boolean;
  handleUpdate: (newValue: string) => void;
}

const EditableCell = (props: EditableCellProps) => {
  const { value: initialValue, handleUpdate, isMarkdown } = props;

  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue);
  const [editMarkdown, setEditMarkdown] = useState(false);
  const ref = useRef<HTMLAreaElement>();
  const onChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value), []);

  // We'll only update the external data when the input is blurred
  const onBlur = useCallback(() => {
    handleUpdate(value);
    setEditMarkdown(false);
  }, [handleUpdate, value]);

  //TODO: maybe we can unify this with `useReactiveTextInput`
  const onKeyDown = getHotkeyHandler([
    ['mod + Enter', () => ref.current?.blur()],
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

  if (isMarkdown && !editMarkdown) {
    return (
      <MarkdownArea
        variant='ontime-filled'
        size='sm'
        value={value}
        submitHandler={setValue}
        editHandler={() => setEditMarkdown(true)}
      />
    );
  }

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
      autoFocus={editMarkdown}
    />
  );
};

export default memo(EditableCell);
