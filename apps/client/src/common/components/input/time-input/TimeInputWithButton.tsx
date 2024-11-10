import { PropsWithChildren } from 'react';
import { InputGroup } from '@chakra-ui/react';

import { useFrozen } from '../../../../common/hooks/useSocket';
import { cx } from '../../../utils/styleUtils';

import TimeInput from './TimeInput';

import style from './TimeInputWithButton.module.scss';

interface TimeInputWithButtonProps<T extends string> {
  name: T;
  submitHandler: (field: T, value: string) => void;
  time?: number;
  hasDelay?: boolean;
  disabled?: boolean;
  placeholder: string;
}

export default function TimeInputWithButton<T extends string>(props: PropsWithChildren<TimeInputWithButtonProps<T>>) {
  const { name, submitHandler, time, hasDelay, placeholder, disabled, children } = props;
  const { frozen } = useFrozen();

  const inputClasses = cx([style.timeInput, hasDelay ? style.delayed : null]);

  return (
    <InputGroup size='sm' className={inputClasses} width='fit-content'>
      <TimeInput<T>
        name={name}
        submitHandler={submitHandler}
        time={time}
        placeholder={placeholder}
        align='left'
        disabled={frozen || disabled}
      />
      {children}
    </InputGroup>
  );
}
