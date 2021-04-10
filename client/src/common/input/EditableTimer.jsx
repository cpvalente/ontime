import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { useEffect, useState } from 'react';
import { addAndFormat, timeToDate, dateToTime } from '../dateConfig';
import style from './EditableTimer.module.css';

export default function EditableTimer(props) {
  const { name, updateValues, time, delay } = props;
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState('');

  // prepare time fields
  useEffect(() => {
    setValue(addAndFormat(time, delay));
  }, [time, delay]);

  const handleSubmit = (submitedVal) => {
    console.log('edit: on submit');

    if (submitedVal === value) return;

    updateValues(name, timeToDate(submitedVal));
    setValue(addAndFormat(time, delay));
  };

  const showNormal = () => {
    console.log('edit: on edit');
    setValue(dateToTime(time));
  };

  const handleChange = (submitedVal) => {
    console.log('edit: change handler', submitedVal);
    setValue(submitedVal);
  };

  const handleBlur = () => {
    console.log('edit: onBlur');
    setValue(addAndFormat(time, delay));
  };

  return (
    <div className={style.time}>
      <Editable
        // submitOnBlur={false}
        // onEdit={showNormal}
        onSubmit={(v) => handleSubmit(v)}
        onChange={(v) => handleChange(v)}
        onBlur={(v) => handleBlur(v)}
        value={value}
        placeholder='--:--'
        style={{ textAlign: 'center' }}
        className={delay > 0 && style.delayedEditable}
      >
        <EditablePreview />
        <EditableInput type='time' min='00:00' max='23:59' />
      </Editable>
    </div>
  );
}
