import { Input } from '@chakra-ui/react';
import { IoSunny } from '@react-icons/all-files/io5/IoSunny';

import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
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

  const handleInputChange = (newValue: string) => {
    changeHandler(newValue);
  };

  return (
    <div className={`${visible ? style.inputRowActive : ''}`}>
      <label className={style.label}>{label}</label>
      <div className={style.inputItems}>
        <Input
          size='sm'
          variant='filled'
          value={text}
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder={placeholder}
        />
        <TooltipActionBtn
          clickHandler={() => actionHandler('update', { field: 'isPublic', value: !visible })}
          tooltip={visible ? 'Make invisible' : 'Make visible'}
          aria-label={`Toggle ${label}`}
          openDelay={tooltipDelayMid}
          icon={<IoSunny size='18px' />}
          colorScheme='blue'
          variant={visible ? 'solid' : 'outline'}
          size='sm'
        />
      </div>
    </div>
  );
}
