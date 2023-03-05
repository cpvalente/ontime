import { ChangeEvent, KeyboardEvent, useCallback, useContext, useEffect, useState } from 'react';

import { EventEditorSubmitActions } from '../../../../features/event-editor/EventEditor';
import { LoggingContext } from '../../../context/LoggingContext';
import { forgivingStringToMillis } from '../../../utils/dateConfig';
import { stringFromMillis } from '../../../utils/time';
import { TimeEntryField } from '../../../utils/timesManager';

interface UseTimeInputReturn {
  value: string;
  onChange: (event: ChangeEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: ChangeEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export default function useTimeInput(
  initialValue: string,
  inputRef: React.RefObject<HTMLInputElement>,
  time: number,
  delay: number,
  previousEnd: number,
  name: TimeEntryField,
  submitCallback: (name: EventEditorSubmitActions, newValMillis: number) => void,
  validationCallback: (name: TimeEntryField, newValMillis: number) => boolean,
): UseTimeInputReturn {
  const [value, setValue] = useState(initialValue);
  const { emitError } = useContext(LoggingContext);

  useEffect(() => {
    if (typeof initialValue === 'undefined') {
      setValue('');
    } else {
      setValue(initialValue);
    }
  }, [initialValue]);

  /**
   * @description Resets input value to given
   */
  const resetValue = useCallback(() => {
    // Todo: check if change is necessary
    try {
      setValue(stringFromMillis(time + delay));
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

      // Time now and time submittedVal
      const originalMillis = time + delay;

      // check if time is different from before
      if (newValMillis === originalMillis) return false;

      // validate with parent
      if (!validationCallback(name, newValMillis)) return false;

      // update entry
      submitCallback(name, newValMillis);

      return true;
    },
    [delay, name, previousEnd, submitCallback, time, validationCallback],
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
        setValue(stringFromMillis(ms + delay));
      } else {
        resetValue();
      }
    },
    [delay, handleSubmit, resetValue],
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
        inputRef.current?.blur();
        resetValue();
      }
    },
    [resetValue, validateAndSubmit],
  );

  useEffect(() => {
    if (time == null) return;
    resetValue();
  }, [emitError, resetValue, time]);

  return {
    value: value,
    onChange: (event) => setValue((event.target as HTMLInputElement).value),
    onFocus: () => handleFocus(),
    onKeyDown: (event) => onKeyDownHandler(event as KeyboardEvent<HTMLInputElement>),
    onBlur: (event) => validateAndSubmit((event.target as HTMLInputElement).value),
  };
}
