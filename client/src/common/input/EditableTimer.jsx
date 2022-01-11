import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { useContext, useEffect, useState } from 'react';
import { forgivingStringToMillis } from '../utils/dateConfig';
import { stringFromMillis } from 'ontime-utils/time';
import style from './EditableTimer.module.css';
import { LoggingContext } from '../../app/context/LoggingContext';

export default function EditableTimer(props) {
  const { name, actionHandler, time, delay, validate } = props;
  const { emitError } = useContext(LoggingContext);
  const [value, setValue] = useState('');

  // prepare time fields
  useEffect(() => {
    if (time == null) return;
    try {
      setValue(stringFromMillis(time + delay));
    } catch (error) {
      emitError(`Unable to parse date: ${error.text}`);
    }
  }, [time, delay, emitError]);

  const validateValue = (value) => {
    const success = handleSubmit(value);
    if (success) setValue(value);
    else setValue(stringFromMillis(time + delay, true));
  };

  const handleSubmit = (value) => {
    // Check if there is anything there
    if (value === '') return false;

    // check for known aliases
    if (value === 'p' || value === 'prev' || value === 'previous') {
      // string to pass should be the time of the end before
    }

    if (value.startsWith('+')) {
      // string to pass should add to the end before
    }

    // convert entered value to milliseconds
    const newValMillis = forgivingStringToMillis(value);

    // Time now and time submittedVal
    const originalMillis = time + delay;

    // check if time is different from before
    if (newValMillis === originalMillis) return false;

    // validate with parent
    if (!validate(name, newValMillis)) return false;

    // update entry
    actionHandler('update', { field: name, value: newValMillis });

    return true;
  };

  return (
    <Editable
      onChange={(v) => setValue(v)}
      onSubmit={(v) => validateValue(v)}
      onCancel={() => setValue(stringFromMillis(time + delay, true))}
      value={value}
      className={delay > 0 ? style.delayedEditable : style.editable}
    >
      <EditablePreview />
      <EditableInput type='text' placeholder='--:--:--' />
    </Editable>
  );
}
