import { useCallback, useEffect, useRef, useState } from 'react';
import { millisToString, parseUserTime } from 'ontime-utils';

import { formatDuration } from '../../../../common/utils/time';

import SingleLineCell from './SingleLineCell';
import TextLikeInput from './TextLikeInput';

interface TimeInputDurationProps {
  initialValue: number;
  lockedValue: boolean;
  onSubmit: (value: string) => void;
}

export default function TimeInputDuration(props: TimeInputDurationProps) {
  const { initialValue, lockedValue, onSubmit } = props;

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

      // Check if there is anything there
      if (newValue === '') {
        return;
      }

      // TODO: is this valid in the duration input?
      // we dont know the values in the rundown, escalate to handler
      if (newValue.startsWith('p') || newValue.startsWith('+')) {
        onSubmit(newValue);
      }

      const valueInMillis = parseUserTime(newValue);
      if (valueInMillis < 0 || isNaN(valueInMillis)) {
        setValue(initialValue);
        return;
      }

      if (valueInMillis === initialValue) {
        return;
      }

      onSubmit(newValue);
      setValue(Number(newValue));
    },
    [initialValue, onSubmit],
  );

  // duration times have a special format
  const duration = formatDuration(value, false);
  const timeString = millisToString(value);

  return isEditing ? (
    <SingleLineCell
      ref={inputRef}
      initialValue={timeString}
      handleUpdate={handleUpdate}
      handleCancelUpdate={handleFakeBlur}
    />
  ) : (
    <TextLikeInput onClick={handleFakeFocus} onFocus={handleFakeFocus} muted={!lockedValue}>
      {duration}
    </TextLikeInput>
  );
}
