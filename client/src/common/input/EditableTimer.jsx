import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { useEffect, useState } from 'react';
import {
  timeFormat,
  stringFromMillis,
  timeStringToMillis,
} from '../dateConfig';
import { showErrorToast } from '../helpers/toastManager';
import style from './EditableTimer.module.css';

export default function EditableTimer(props) {
  const { name, actionHandler, time, delay, validate } = props;
  const [value, setValue] = useState('');

  // prepare time fields
  useEffect(() => {
    if (time == null) return;
    try {
      setValue(stringFromMillis(time + delay, false));
    } catch (error) {
      showErrorToast('Error parsing date', error.text);
    }
  }, [time, delay]);

  const validateValue = (value) => {
    const success = handleSubmit(value);

    if (success) setValue(value);
    else setValue(stringFromMillis(time + delay, false));
  };

  const handleSubmit = (value) => {
    // Check if there is anything there
    if (value === '') return false;

    // Time now and time submitedVal
    const original = stringFromMillis(time + delay, false);

    // check if time is different from before
    if (value === original) return false;

    // convert to millis object
    const millis = timeStringToMillis(value, timeFormat);

    // validate with parent
    if (!validate(name, millis)) return false;

    // update entry
    actionHandler('update', { field: name, value: millis });

    return true;
  };

  return (
    <Editable
      onChange={(v) => setValue(v)}
      onSubmit={(v) => validateValue(v)}
      value={value}
      placeholder='--:--'
      className={delay > 0 ? style.delayedEditable : style.editable}
    >
      <EditablePreview />
      <EditableInput type='time' min='00:00' max='23:59' />
    </Editable>
  );
}
