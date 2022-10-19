import { useEffect, useState } from 'react';
import { Editable, EditableInput, EditablePreview, IconButton, Tooltip } from '@chakra-ui/react';
import { IoSunny } from '@react-icons/all-files/io5/IoSunny';

import { tooltipDelayMid } from '../../../ontimeConfig';

import style from './MessageControl.module.scss';

interface InputRowProps {
  label: string;
  placeholder: string;
  text: string;
  visible: boolean;
  actionHandler: (action: string, payload: object) => void;
  changeHandler: (newValue: string) => void;
}

export default function InputRow(props: InputRowProps) {
  const { label, placeholder, text, visible, actionHandler, changeHandler } = props;
  const [inputText, setInputText] = useState<string>(text || '');

  const handleInputChange = (newValue: string) => {
    setInputText(newValue);
    changeHandler(newValue);
  };

  useEffect(() => {
    if (text) {
      setInputText(text);
    }
  }, [text]);


  return (
    <div className={`${visible ? style.inputRowActive : ''}`}>
      <span className={style.label}>{label}</span>
      <div className={style.inputItems}>
        <Editable
          onChange={(newValue) => handleInputChange(newValue)}
          value={inputText}
          placeholder={placeholder}
          className={style.inline}
          color={text === '' ? '#666' : 'inherit'}
        >
          <EditablePreview className={`${style.padleft} ${style.fullWidth}`} />
          <EditableInput className={style.padleft} />
        </Editable>
        <Tooltip label={visible ? 'Make invisible' : 'Make visible'} openDelay={tooltipDelayMid}>
          <IconButton
            aria-label='Toggle visibility'
            size='sm'
            icon={<IoSunny size='18px' />}
            colorScheme='blue'
            variant={visible ? 'solid' : 'outline'}
            onClick={() => actionHandler('update', { field: 'isPublic', value: !visible })}
          />
        </Tooltip>
      </div>
    </div>
  );
}
