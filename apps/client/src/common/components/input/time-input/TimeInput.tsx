import { FocusEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@chakra-ui/react';
import { millisToString } from 'ontime-utils';

import { useEmitLog } from '../../../stores/logger';
import { forgivingStringToMillis } from '../../../utils/dateConfig';
import { TimeEntryField } from '../../../utils/timesManager';

import style from './TimeInput.module.scss';
interface TimeInputProps {
  id?: TimeEntryField;
  name: TimeEntryField;
  submitHandler: (field: TimeEntryField, value: number) => void;
  time?: number;
  delay?: number;
  placeholder: string;
  previousEnd?: number;
  className?: string;
}

export default function TimeInput(props: TimeInputProps) {
  const { id, name, submitHandler, time = 0, delay = 0, placeholder, previousEnd = 0, className } = props;
  const { emitError } = useEmitLog();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState<string>('');
  const ignoreChange = useRef(false);

  /**
   * @description Resets input value to given
   */
  const resetValue = useCallback(() => {
    try {
      setValue(millisToString(time));
    } catch (error) {
      setValue(millisToString(0));
      emitError(`Unable to parse time ${time}: ${error}`);
    }
  }, [emitError, time]);

  /**
   * @description Selects input text on focus
   */
  const handleFocus = useCallback(() => {
    inputRef.current?.select();
  }, []);

  /**
   * @description Submit handler
   * @param {string} newValue
   */
  const handleSubmit = useCallback(
    (newValue: string) => {
      // Check if there is anything there
      if (newValue === '') {
        return false;
      }

      let newValMillis = 0;

      // check for known aliases
      if (newValue === 'p' || newValue === 'prev' || newValue === 'previous') {
        // string to pass should be the time of the end before
        if (previousEnd != null) {
          newValMillis = previousEnd;
        }
      } else if (newValue.startsWith('+') || newValue.startsWith('p+') || newValue.startsWith('p +')) {
        // string to pass should add to the end before
        const val = newValue.substring(1);
        newValMillis = previousEnd + forgivingStringToMillis(val);
      } else {
        // convert entered value to milliseconds
        newValMillis = forgivingStringToMillis(newValue);
      }

      // check if time is different from before
      if (newValMillis === time) return false;

      // update entry
      submitHandler(name, newValMillis);

      return true;
    },
    [name, previousEnd, submitHandler, time],
  );

  /**
   * @description Prepare time fields
   * @param {string} value string to be parsed
   */
  const validateAndSubmit = useCallback(
    (newValue: string) => {
      const success = handleSubmit(newValue);
      if (success) {
        const ms = forgivingStringToMillis(newValue);
        const delayed = name === 'timeEnd' ? Math.max(0, ms + delay) : Math.max(0, ms + delay);
        setValue(millisToString(delayed));
      } else {
        resetValue();
      }
    },
    [delay, handleSubmit, name, resetValue],
  );

  /**
   * @description Handles common keys for submit and cancel
   * @param {KeyboardEvent} event
   */
  const onKeyDownHandler = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        inputRef.current?.blur();
        validateAndSubmit((event.target as HTMLInputElement).value);
      } else if (event.key === 'Tab') {
        validateAndSubmit((event.target as HTMLInputElement).value);
      }
      if (event.key === 'Escape') {
        ignoreChange.current = true;
        inputRef.current?.blur();
        resetValue();
      }
    },
    [resetValue, validateAndSubmit],
  );

  const onBlurHandler = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (ignoreChange.current) {
        ignoreChange.current = false;
        return;
      }
      validateAndSubmit((event.target as HTMLInputElement).value);
    },
    [validateAndSubmit],
  );

  useEffect(() => {
    if (time == null) return;
    resetValue();
  }, [resetValue, time]);

  const timeInputClass = className ? className : style.timeInput;

  return (
    <Input
      size='sm'
      ref={inputRef}
      id={id}
      data-testid={`time-input-${name}`}
      className={timeInputClass}
      type='text'
      placeholder={placeholder}
      variant='ontime-filled'
      onFocus={handleFocus}
      onChange={(event) => setValue(event.target.value)}
      onBlur={onBlurHandler}
      onKeyDown={onKeyDownHandler}
      value={value}
      maxLength={8}
      autoComplete='off'
    />
  );
}
