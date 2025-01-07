import { useEffect, useRef } from 'react';
import { IoEye } from 'react-icons/io5';
import { IoEyeOffOutline } from 'react-icons/io5';
import { Input } from '@chakra-ui/react';

import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import { tooltipDelayMid } from '../../../ontimeConfig';

import style from './InputRow.module.scss';

interface InputRowProps {
  label: string;
  placeholder: string;
  text: string;
  visible: boolean;
  actionHandler: () => void;
  changeHandler: (newValue: string) => void;
}

export default function InputRow(props: InputRowProps) {
  const { label, placeholder, text, visible, actionHandler, changeHandler } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef(0);

  // sync cursor position with text
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.selectionStart = cursorPositionRef.current;
      inputRef.current.selectionEnd = cursorPositionRef.current;
    }
  }, [text]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    cursorPositionRef.current = event.target.selectionStart ?? 0;
    changeHandler(event.target.value);
  };

  return (
    <div className={style.inputRow}>
      <label className={`${style.label} ${visible ? style.active : ''}`}>{label}</label>
      <div className={style.inputItems}>
        <Input
          ref={inputRef}
          size='sm'
          variant='ontime-filled'
          value={text}
          onChange={handleInputChange}
          placeholder={placeholder}
        />
        <TooltipActionBtn
          clickHandler={actionHandler}
          tooltip={visible ? 'Make invisible' : 'Make visible'}
          aria-label={`Toggle ${label}`}
          openDelay={tooltipDelayMid}
          icon={visible ? <IoEye size='18px' /> : <IoEyeOffOutline size='18px' />}
          variant={visible ? 'ontime-filled' : 'ontime-subtle'}
          size='sm'
        />
      </div>
    </div>
  );
}
