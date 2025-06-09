import { memo, PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { TimeFormat } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';

import SingleLineCell from './SingleLineCell';
import TextLikeInput from './TextLikeInput';

interface TimeInputDurationProps {
  initialValue: number;
  lockedValue: boolean;
  delayed?: boolean;
  timeFormat?: TimeFormat;
  onSubmit: (value: string) => void;
}

interface ParentFocusableInput extends HTMLInputElement {
  focusParentElement: () => void;
}

export default memo(TimeInputDuration);

function TimeInputDuration(props: PropsWithChildren<TimeInputDurationProps>) {
  const { initialValue, lockedValue, delayed, timeFormat, onSubmit, children } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<ParentFocusableInput>(null);
  const textRef = useRef<ParentFocusableInput>(null);

  // when we go into edit mode, set focus to the input
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // reset value when initialValue changes, avoiding interrupting the user if we are in edit mode
  useEffect(() => {
    if (!isEditing) {
      setValue(initialValue);
    }
  }, [initialValue, isEditing]);

  const handleFakeFocus = () => setIsEditing(true);
  const handleFakeBlur = () => {
    setIsEditing(false);
    setTimeout(() => textRef.current?.focusParentElement()); // Immediate timeout to ensure state change takes place first
  };

  const handleUpdate = useCallback(
    (newValue: string) => {
      setIsEditing(false);

      // if the user sends an empty string, we want to clear the value
      if (newValue === '') {
        onSubmit(newValue);
        inputRef.current?.focusParentElement();
        return;
      }

      // we dont know the values in the rundown, escalate to handler
      if (newValue.startsWith('p') || newValue.startsWith('+')) {
        onSubmit(newValue);
        inputRef.current?.focusParentElement();
        return;
      }

      const valueInMillis = parseUserTime(newValue);
      if (valueInMillis < 0 || isNaN(valueInMillis)) {
        setValue(initialValue);
        setTimeout(() => textRef.current?.focusParentElement()); // Immediate timeout to ensure state change takes place first
        return;
      }

      // if the value is the same, we may still want to push the lock change
      if (valueInMillis === initialValue && lockedValue) {
        inputRef.current?.focusParentElement();
        return;
      }

      onSubmit(newValue);
      setValue(Number(newValue));
      setTimeout(() => textRef.current?.focusParentElement()); // Immediate timeout to ensure state change takes place first
    },
    [initialValue, lockedValue, onSubmit],
  );

  const timeString = millisToString(value, { timeFormat });

  return isEditing ? (
    <SingleLineCell
      ref={inputRef}
      initialValue={timeString}
      allowSubmitSameValue={!lockedValue} // if the value is not locked, submitting will lock the value
      handleUpdate={handleUpdate}
      handleCancelUpdate={handleFakeBlur}
    />
  ) : (
    <TextLikeInput
      onClick={handleFakeFocus}
      onFocus={handleFakeFocus}
      muted={!lockedValue}
      delayed={delayed}
      ref={textRef}
    >
      {children}
    </TextLikeInput>
  );
}
