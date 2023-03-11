import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input, InputGroup, InputLeftElement, Tooltip } from '@chakra-ui/react';
import { millisToString } from 'ontime-utils';

import { EventEditorSubmitActions } from '../../../../features/event-editor/EventEditor';
import { tooltipDelayFast } from '../../../../ontimeConfig';
import { useEmitLog } from '../../../stores/logger';
import { forgivingStringToMillis } from '../../../utils/dateConfig';
import { TimeEntryField } from '../../../utils/timesManager';

import style from './TimeInput.module.scss';

interface TimeInputProps {
  name: TimeEntryField;
  submitHandler: (field: EventEditorSubmitActions, value: number) => void;
  time?: number;
  delay?: number;
  placeholder: string;
  validationHandler: (entry: TimeEntryField, val: number) => boolean;
  previousEnd?: number;
}

export default function TimeInput(props: TimeInputProps) {
  const {
    name, submitHandler, time = 0, delay = 0, placeholder, validationHandler, previousEnd = 0,
  } = props;
  const { emitError } = useEmitLog();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState('');

  /**
   * @description Resets input value to given
   */
  const resetValue = useCallback(() => {
    // Todo: check if change is necessary
    try {
      setValue(millisToString(time + delay));
    } catch (error) {
      emitError(`Unable to parse date: ${error}`);
    }
  }, [delay, emitError, time]);

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
  const handleSubmit = useCallback((newValue: string) => {
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

    // Time now and time submittedVal
    const originalMillis = time + delay;

    // check if time is different from before
    if (newValMillis === originalMillis) return false;

    // validate with parent
    if (!validationHandler(name, newValMillis)) return false;

    // update entry
    submitHandler(name, newValMillis);

    return true;
  }, [delay, name, previousEnd, submitHandler, time, validationHandler]);

  /**
   * @description Prepare time fields
   * @param {string} value string to be parsed
   */
  const validateAndSubmit = useCallback((newValue: string) => {
    const success = handleSubmit(newValue);
    if (success) {
      const ms = forgivingStringToMillis(newValue);
      setValue(millisToString(ms + delay));
    } else {
      resetValue();
    }
  }, [delay, handleSubmit, resetValue]);

  /**
   * @description Handles common keys for submit and cancel
   * @param {KeyboardEvent} event
   */
  const onKeyDownHandler = useCallback((event:KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      inputRef.current?.blur();
      validateAndSubmit((event.target as HTMLInputElement).value);
    } else if (event.key === 'Tab') {
      validateAndSubmit((event.target as HTMLInputElement).value);
    }
    if (event.key === 'Escape') {
      inputRef.current?.blur();
      resetValue();
    }
  }, [resetValue, validateAndSubmit]);

  useEffect(() => {
    if (time == null) return;
    resetValue();
  }, [emitError, resetValue, time]);

  const isDelayed = delay != null && delay !== 0;

  const ButtonInitial = () => {
    if (name === 'timeStart') return 'S';
    if (name === 'timeEnd') return 'E';
    if (name === 'durationOverride') return 'D';
    return '';
  };

  const ButtonTooltip = () => {
    if (name === 'timeStart') return 'Start';
    if (name === 'timeEnd') return 'End';
    if (name === 'durationOverride') return 'Duration';
    return '';
  };

  return (
    <InputGroup size='sm' className={`${style.timeInput} ${isDelayed ? style.delayed : ''}`}>
      <InputLeftElement width='fit-content'>
        <Tooltip label={ButtonTooltip()} openDelay={tooltipDelayFast} variant='ontime-ondark'>
          <Button
            size='sm'
            variant='ontime-subtle-white'
            className={`${style.inputButton} ${isDelayed ? style.delayed : ''}`}
            tabIndex={-1}
            border={isDelayed ? '1px solid #E69056' : '1px solid transparent'}
            borderRight='1px solid transparent'
            borderRadius='2px 0 0 2px'
          >
            {ButtonInitial()}
          </Button>
        </Tooltip>
      </InputLeftElement>
      <Input
        ref={inputRef}
        data-testid='time-input'
        className={style.inputField}
        type='text'
        placeholder={placeholder}
        variant='ontime-filled'
        onFocus={handleFocus}
        onChange={(event) => setValue(event.target.value)}
        onBlur={resetValue}
        onKeyDown={onKeyDownHandler}
        value={value}
        maxLength={8}
      />
    </InputGroup>
  );
}
