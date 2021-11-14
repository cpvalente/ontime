import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { useEffect, useState } from 'react';
import { stringFromMillis, timeStringToMillis } from '../utils/dateConfig';
import { showErrorToast } from '../helpers/toastManager';
import style from './EditableTimer.module.css';

export default function EditableTimer(props) {
  const { name, actionHandler, time, delay, validate } = props;
  const [value, setValue] = useState('');

  // prepare time fields
  useEffect(() => {
    if (time == null) return;
    try {
      setValue(stringFromMillis(time + delay));
    } catch (error) {
      showErrorToast('Error parsing date', error.text);
    }
  }, [time, delay]);

  const validateValue = (value) => {
    const success = handleSubmit(value);
    if (success) setValue(value);
    else setValue(stringFromMillis(time + delay, true));
  };

  const handleSubmit = (value) => {
    // Check if there is anything there
    if (value === '') return false;

    // Time now and time submitedVal
    const original = stringFromMillis(time + delay, true);

    // check if time is different from before
    if (value === original) return false;

    // convert to millis object
    const millis = timeStringToMillis(value);

    // validate with parent
    if (!validate(name, millis)) return false;

    // update entry
    actionHandler('update', { field: name, value: millis });

    return true;
  };

  const handleChange = (v) => {
    // if empty
    if (v === '00:00:00') {
      setValue(v);
    } else {
      // make sure it has seconds 00:00:00
      const val = v.split(':').length === 3 ? v : `${v}:00`;
      setValue(val);
    }
  };

  return (
    <Editable
      onChange={(v) => handleChange(v)}
      onSubmit={(v) => validateValue(v)}
      onCancel={() => setValue(stringFromMillis(time + delay, true))}
      value={value}
      placeholder='--:--:--'
      className={delay > 0 ? style.delayedEditable : style.editable}
    >
      <EditablePreview />
      <EditableInput type='time' step='1' min='00:00:00' max='23:59:00' />
    </Editable>
  );
}
