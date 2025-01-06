import { ReactNode } from 'react';

import { cx } from '../../../utils/styleUtils';
import { InputGroup } from '../../ui/input-group';

import TimeInput from './TimeInput';

import style from './TimeInputWithButton.module.scss';

interface TimeInputWithButtonProps<T extends string> {
  name: T;
  submitHandler: (field: T, value: string) => void;
  time?: number;
  hasDelay?: boolean;
  disabled?: boolean;
  placeholder: string;
  startElement?: ReactNode;
  endElement?: ReactNode;
}

export default function TimeInputWithButton<T extends string>(props: TimeInputWithButtonProps<T>) {
  const { name, submitHandler, time, hasDelay, placeholder, disabled, startElement, endElement } = props;

  const inputClasses = cx([style.timeInput, hasDelay ? style.delayed : null]);

  return (
    <InputGroup
      size='sm'
      className={inputClasses}
      width='fit-content'
      startElement={startElement}
      endElement={endElement}
    >
      <TimeInput<T>
        name={name}
        submitHandler={submitHandler}
        time={time}
        placeholder={placeholder}
        align='left'
        disabled={disabled}
      />
    </InputGroup>
  );
}
