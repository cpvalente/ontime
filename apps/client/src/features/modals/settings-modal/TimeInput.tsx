import { FocusEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Input, InputGroup } from '@chakra-ui/react';
import { millisToString } from 'ontime-utils';

import { useEmitLog } from '../../../common/stores/logger';
import { forgivingStringToMillis } from '../../../common/utils/dateConfig';
import { cx } from '../../../common/utils/styleUtils';

import style from './TimeInput.module.scss';

interface TimeInputProps {
  id?: string;
  name: string;
  submitHandler: (field: string, value: number) => void;
  time?: number;
  validationHandler?: (entry: string, val: number) => boolean;
  previousEnd?: number;
}

export default function TimeInput(props: TimeInputProps) {
  const { id, name, submitHandler, time = 0, previousEnd = 0 } = props;
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

      // validate with parent
      // if (!validationHandler(name, newValMillis)) return false;

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
        setValue(millisToString(ms));
      } else {
        resetValue();
      }
    },
    [handleSubmit, resetValue],
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

  const inputClasses = cx([style.timeInput]);

  return (
    <InputGroup size='sm' className={inputClasses}>
      <Input
        ref={inputRef}
        id={id}
        data-testid={`time-input-${name}`}
        className={style.inputField}
        type='text'
        variant='ontime-filled-on-light'
        onFocus={handleFocus}
        onChange={(event) => setValue(event.target.value)}
        onBlur={onBlurHandler}
        onKeyDown={onKeyDownHandler}
        value={value}
        maxLength={8}
        autoComplete='off'
      />
    </InputGroup>
  );
}
