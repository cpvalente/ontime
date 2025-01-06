import { memo, PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { millisToString, parseUserTime } from 'ontime-utils';

import SingleLineCell from './SingleLineCell';
import TextLikeInput from './TextLikeInput';

interface TimeInputDurationProps {
  initialValue: number;
  lockedValue: boolean;
  delayed?: boolean;
  onSubmit: (value: string) => void;
}

export default memo(TimeInputDuration);

function TimeInputDuration(props: PropsWithChildren<TimeInputDurationProps>) {
  const { initialValue, lockedValue, delayed, onSubmit, children } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const handleFakeBlur = () => setIsEditing(false);

  const handleUpdate = useCallback(
    (newValue: string) => {
      setIsEditing(false);

      // if the user sends an empty string, we want to clear the value
      if (newValue === '') {
        onSubmit(newValue);
        return;
      }

      // we dont know the values in the rundown, escalate to handler
      if (newValue.startsWith('p') || newValue.startsWith('+')) {
        onSubmit(newValue);
        return;
      }

      const valueInMillis = parseUserTime(newValue);
      if (valueInMillis < 0 || isNaN(valueInMillis)) {
        setValue(initialValue);
        return;
      }

      // if the value is the same, we may still want to push the lock change
      if (valueInMillis === initialValue && lockedValue) {
        return;
      }

      onSubmit(newValue);
      setValue(Number(newValue));
    },
    [initialValue, lockedValue, onSubmit],
  );

  const timeString = millisToString(value);

  return isEditing ? (
    <SingleLineCell
      ref={inputRef}
      initialValue={timeString}
      allowSubmitSameValue={!lockedValue} // if the value is not locked, submitting will lock the value
      handleUpdate={handleUpdate}
      handleCancelUpdate={handleFakeBlur}
    />
  ) : (
    <TextLikeInput onClick={handleFakeFocus} onFocus={handleFakeFocus} muted={!lockedValue} delayed={delayed}>
      {children}
    </TextLikeInput>
  );
}
