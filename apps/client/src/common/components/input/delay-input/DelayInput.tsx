import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { millisToString, parseUserTime } from 'ontime-utils';

import { useEntryActions } from '../../../hooks/useEntryAction';
import Input from '../input/Input';

import BlockRadio from './BlockRadio';

import style from './DelayInput.module.scss';

interface DelayInputProps {
  eventId: string;
  duration: number;
}

export default function DelayInput(props: DelayInputProps) {
  const { eventId, duration } = props;
  const { updateEntry } = useEntryActions();

  const [value, setValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  // avoid wrong submit on cancel
  let ignoreChange = false;

  // set internal value on duration change
  useEffect(() => {
    if (typeof duration === 'undefined') {
      return;
    }
    setValue(millisToString(duration));
  }, [duration]);

  /**
   * @description Prepare delay value for update
   * @param {string} newValue string to be parsed
   */
  const validateAndSubmit = (newValue: string) => {
    if (ignoreChange) {
      ignoreChange = false;
      return;
    }

    const isNegative = newValue.startsWith('-');
    let newMillis = parseUserTime(newValue);

    if (isNegative) {
      newMillis = newMillis * -1;
    }

    if (newMillis === duration) {
      return;
    }

    submitChange(newMillis);
    setValue(millisToString(newMillis));
  };

  const submitChange = (value: number) => {
    updateEntry({
      id: eventId,
      duration: value,
    });
  };

  /**
   * @description Selects input text on focus
   */
  const handleFocus = () => inputRef.current?.select();

  /**
   * @description Handles common keys for submit and cancel
   * @param {KeyboardEvent} event
   */
  const onKeyDownHandler = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      inputRef.current?.blur();
      validateAndSubmit((event.target as HTMLInputElement).value);
    } else if (event.key === 'Tab') {
      validateAndSubmit((event.target as HTMLInputElement).value);
    } else if (event.key === 'Escape') {
      ignoreChange = true;
      setValue(millisToString(duration));
      inputRef.current?.blur();
    }
  };

  /**
   * @description handles direction change to delay
   * @param newDirection
   */
  const handleSlipChange = (newDirection: 'add' | 'subtract') => {
    if (newDirection === 'add') {
      // add time
      if (duration < 0) {
        submitChange(duration * -1);
      }
    } else if (newDirection === 'subtract') {
      // subtract time
      if (duration > 0) {
        submitChange(duration * -1);
      }
    }
  };

  const checkedOption = value.startsWith('-') ? 'subtract' : 'add';

  return (
    <div className={style.delayInput}>
      <Input
        ref={inputRef}
        data-testid='delay-input'
        className={style.inputField}
        placeholder='-'
        onFocus={handleFocus}
        onChange={(event) => setValue(event.target.value)}
        onBlur={(event) => validateAndSubmit(event.target.value)}
        onKeyDown={onKeyDownHandler}
        value={value}
        maxLength={9}
      />
      <BlockRadio
        onValueChange={handleSlipChange}
        value={checkedOption}
        items={[
          { value: 'add', label: 'Add time' },
          { value: 'subtract', label: 'Subtract time' },
        ]}
      />
    </div>
  );
}
