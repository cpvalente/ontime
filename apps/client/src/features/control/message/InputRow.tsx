import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Input } from '@chakra-ui/react';

import { cx } from '../../../common/utils/styleUtils';

import style from './InputRow.module.scss';

interface InputRowProps {
  label: string;
  placeholder: string;
  text: string;
  visible: boolean;
  changeHandler: (newValue: string) => void;
}

export default function InputRow(props: PropsWithChildren<InputRowProps>) {
  const { label, placeholder, text, visible, changeHandler, children } = props;

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
    <div className={style.inputRow}>
      <label className={cx([style.label, visible ?? style.active])} htmlFor={label}>
        {label}
      </label>
      <div className={style.inputItems}>
        <Input
          id={label}
          ref={inputRef}
          size='sm'
          variant='ontime-filled'
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
        />
        {children}
      </div>
    </div>
  );
}
