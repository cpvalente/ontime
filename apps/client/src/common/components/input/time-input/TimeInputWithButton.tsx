import { Button, InputGroup, InputLeftElement, Tooltip } from '@chakra-ui/react';

import { tooltipDelayFast } from '../../../../ontimeConfig';
import { cx } from '../../../utils/styleUtils';

import TimeInput from './TimeInput';

import style from './TimeInputWithButton.module.scss';

interface TimeInputWithButtonProps<T extends string> {
  name: T;
  submitHandler: (field: T, value: string) => void;
  time?: number;
  hasDelay?: boolean;
  placeholder: string;
}

export default function TimeInputWithButton<T extends string>(props: TimeInputWithButtonProps<T>) {
  const { name, submitHandler, time, hasDelay, placeholder } = props;

  const inputClasses = cx([style.timeInput, hasDelay ? style.delayed : null]);

  return (
    <InputGroup size='sm' className={inputClasses} width='fit-content'>
      <InputLeftElement className={style.inputLeft}>
        <Tooltip label={placeholder} openDelay={tooltipDelayFast} variant='ontime-ondark'>
          <Button size='sm' variant='ontime-subtle-white' className={style.inputButton} tabIndex={-1}>
            {placeholder.charAt(0)}
          </Button>
        </Tooltip>
      </InputLeftElement>
      <TimeInput<T>
        name={name}
        submitHandler={submitHandler}
        time={time}
        placeholder={placeholder}
        className={style.inputField}
      />
    </InputGroup>
  );
}
