import { useEffect, useRef } from 'react';
import { IconButton, Input } from '@chakra-ui/react';
import { IoEye } from '@react-icons/all-files/io5/IoEye';
import { IoEyeOffOutline } from '@react-icons/all-files/io5/IoEyeOffOutline';

import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import { cx } from '../../../common/utils/styleUtils';
import { tooltipDelayMid } from '../../../ontimeConfig';

import style from './InputRow.module.scss';

interface InputRowProps {
  label: string;
  placeholder: string;
  text: string;
  visible?: boolean;
  readonly?: boolean;
  actionHandler: (action: string, payload: object) => void;
  changeHandler: (newValue: string) => void;
  className?: string;
}

export default function InputRow(props: InputRowProps) {
  const { label, placeholder, text, visible, actionHandler, changeHandler, className, readonly } = props;

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

  const classes = cx([style.inputRow, className]);

  return (
    <div className={classes}>
      <label className={`${style.label} ${visible ? style.active : ''}`}>{label}</label>
      <div className={style.inputItems}>
        <Input
          ref={inputRef}
          size='sm'
          variant='ontime-filled'
          readOnly={readonly}
          disabled={readonly}
          value={text}
          onChange={handleInputChange}
          placeholder={placeholder}
        />
        {readonly ? (
          <IconButton
            size='sm'
            isDisabled
            icon={visible ? <IoEye size='18px' /> : <IoEyeOffOutline size='18px' />}
            aria-label={`Toggle ${label}`}
            variant={visible ? 'ontime-filled' : 'ontime-subtle'}
          />
        ) : (
          <TooltipActionBtn
            clickHandler={() => actionHandler('update', { field: 'isPublic', value: !visible })}
            tooltip={visible ? 'Make invisible' : 'Make visible'}
            aria-label={`Toggle ${label}`}
            openDelay={tooltipDelayMid}
            icon={visible ? <IoEye size='18px' /> : <IoEyeOffOutline size='18px' />}
            variant={visible ? 'ontime-filled' : 'ontime-subtle'}
            size='sm'
          />
        )}
      </div>
    </div>
  );
}
