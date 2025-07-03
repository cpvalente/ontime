import { memo, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Input, Radio, RadioGroup } from '@chakra-ui/react';
import { millisToString, parseUserTime } from 'ontime-utils';

import { useEntryActions } from '../../../hooks/useEntryAction';

import style from './DelayInput.module.scss';

interface DelayInputProps {
  eventId: string;
  duration: number;
}

function DelayInputComponent(props: DelayInputProps) {
  const { eventId, duration } = props;
  const { updateEntry } = useEntryActions();

  const [value, setValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ignoreChange = useRef(false); // Changed to ref to be stable for useCallback

  // set internal value on duration change
  useEffect(() => {
    if (typeof duration === 'undefined') {
      return;
    }
    setValue(millisToString(duration));
  }, [duration]);

  const submitChange = useCallback(
    (val: number) => {
      updateEntry({
        id: eventId,
        duration: val,
      });
    },
    [eventId, updateEntry],
  );

  /**
   * @description Prepare delay value for update
   * @param {string} newValue string to be parsed
   */
  const validateAndSubmit = useCallback(
    (newValue: string) => {
      if (ignoreChange.current) {
        ignoreChange.current = false;
        return;
      }

      const isNegative = newValue.startsWith('-');
      let newMillis = parseUserTime(newValue);

      if (isNegative) {
        newMillis = newMillis * -1;
      }

      if (newMillis === duration) {
        // If value hasn't changed effectively, reset visual to formatted prop
        setValue(millisToString(duration));
        return;
      }

      submitChange(newMillis);
      setValue(millisToString(newMillis)); // Update visual to newly submitted value
    },
    [duration, submitChange],
  );

  /**
   * @description Selects input text on focus
   */
  const handleFocus = useCallback(() => {
    inputRef.current?.select();
  }, []);

  /**
   * @description Handles common keys for submit and cancel
   * @param {KeyboardEvent} event
   */
  const onKeyDownHandler = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        inputRef.current?.blur();
        // validateAndSubmit is called onBlur, which is triggered by blur()
      } else if (event.key === 'Tab') {
        // Tab will also trigger blur, so validateAndSubmit will be called.
        // No explicit call needed here unless default Tab behavior needs prevention.
      } else if (event.key === 'Escape') {
        ignoreChange.current = true;
        setValue(millisToString(duration));
        inputRef.current?.blur();
      }
    },
    [duration], // Removed validateAndSubmit from here as it's handled by onBlur
  );

  /**
   * @description handles direction change to delay
   * @param newDirection
   */
  const handleSlipChange = useCallback(
    (newDirection: 'add' | 'subtract') => {
      if (newDirection === 'add') {
        if (duration < 0) {
          submitChange(duration * -1);
        }
      } else if (newDirection === 'subtract') {
        if (duration > 0) {
          submitChange(duration * -1);
        }
      }
    },
    [duration, submitChange],
  );

  const checkedOption = value.startsWith('-') ? 'subtract' : 'add';

  return (
    <div className={style.delayInput}>
      <Input
        size='sm'
        ref={inputRef}
        data-testid='delay-input'
        className={style.inputField}
        type='text'
        placeholder='-'
        variant='ontime-filled'
        onFocus={handleFocus}
        onChange={(event) => setValue(event.target.value)}
        onBlur={(event) => validateAndSubmit(event.target.value)}
        onKeyDown={onKeyDownHandler}
        value={value}
        maxLength={9}
      />
      <RadioGroup
        className={style.delayOptions}
        onChange={handleSlipChange}
        value={checkedOption}
        variant='ontime-block'
        size='sm'
      >
        <Radio value='add'>Add time</Radio>
        <Radio value='subtract'>Subtract time</Radio>
      </RadioGroup>
    </div>
  );
}
export default memo(DelayInputComponent);
