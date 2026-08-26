import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import Input from '../../../common/components/input/input/Input';
import { cx } from '../../../common/utils/styleUtils';

import style from './InputRow.module.scss';

interface InputRowProps {
  label: string;
  placeholder: string;
  text: string;
  /** whether this text is currently on the audience screen */
  visible: boolean;
  changeHandler: (newValue: string) => void;
  /** control which picks where the text is shown, rendered before the input */
  sourcePicker?: ReactNode;
}

export default function InputRow(props: PropsWithChildren<InputRowProps>) {
  const { label, placeholder, text, visible, changeHandler, sourcePicker, children } = props;

  const [value, setValue] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef(0);

  // sync cursor position with text
  useEffect(() => {
    if (inputRef.current && inputRef.current !== document.activeElement) {
      inputRef.current.selectionStart = cursorPositionRef.current;
      inputRef.current.selectionEnd = cursorPositionRef.current;
    }
  }, [text]);

  // synchronise external text
  useEffect(() => {
    if (inputRef.current !== document.activeElement) {
      setValue(text);
    }
  }, [text]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    cursorPositionRef.current = event.target.selectionStart ?? 0;
    setValue(event.target.value);
    changeHandler(event.target.value);
  };

  return (
    <div>
      <Editor.Label className={cx([style.label, visible && style.active])} htmlFor={label}>
        {label}
      </Editor.Label>
      <div className={cx([style.inputItems, sourcePicker && style.withSource])}>
        {sourcePicker}
        <Input id={label} ref={inputRef} value={value} onChange={handleInputChange} placeholder={placeholder} />
        {children}
      </div>
    </div>
  );
}
