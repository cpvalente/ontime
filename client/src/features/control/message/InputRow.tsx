import { Input } from '@chakra-ui/react';
import { IoEye } from '@react-icons/all-files/io5/IoEye';
import { IoEyeOffOutline } from '@react-icons/all-files/io5/IoEyeOffOutline';

import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import { tooltipDelayMid } from '../../../ontimeConfig';

import style from './InputRow.module.scss';

interface InputRowProps {
  label: string;
  placeholder: string;
  text: string;
  visible?: boolean;
  actionHandler: (action: string, payload: object) => void;
  changeHandler: (newValue: string) => void;
}

export default function InputRow(props: InputRowProps) {
  const { label, placeholder, text, visible, actionHandler, changeHandler } = props;

  const handleInputChange = (newValue: string) => {
    changeHandler(newValue);
  };

  return (
    <div className={style.inputRow}>
      <label className={`${style.label} ${visible ? style.active : ''}`}>{label}</label>
      <div className={style.inputItems}>
        <Input
          size='sm'
          variant='ontime-filled'
          value={text}
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder={placeholder}
        />
        <TooltipActionBtn
          clickHandler={() => actionHandler('update', { field: 'isPublic', value: !visible })}
          tooltip={visible ? 'Make invisible' : 'Make visible'}
          aria-label={`Toggle ${label}`}
          openDelay={tooltipDelayMid}
          icon={visible? <IoEye size='18px' /> : <IoEyeOffOutline size='18px' />}
          variant={visible ? 'ontime-filled' : 'ontime-subtle'}
          size='sm'
        />
      </div>
    </div>
  );
}
