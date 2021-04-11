import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { useEffect, useState } from 'react';
import { addAndFormat, timeToDate, dateToTime } from '../dateConfig';
import style from './EditableTimer.module.css';

export default function EditableTimer(props) {
  const { name, updateValues, time, delay } = props;
  const [value, setValue] = useState('');
  const [editing, setEditing] = useState(false);

  // prepare time fields
  useEffect(() => {
    if (time == null) return;
    setValue(addAndFormat(time, delay));
  }, [time, delay]);

  const handleSubmit = (submitedVal) => {
    setValue(addAndFormat(time, delay));
    setEditing(false);

    const newTime = timeToDate(submitedVal);

    // No need to update if it hasnt changed
    if (newTime === value) return;
    updateValues(name, newTime);
  };

  const showNormal = () => {
    if (!editing) setValue(dateToTime(time));
  };

  const handleChange = (submitedVal) => {
    setEditing(true);
    setValue(submitedVal);
  };

  return (
    <div className={style.time}>
      <Editable
        onEdit={() => showNormal}
        onSubmit={(v) => handleSubmit(v)}
        onChange={(v) => handleChange(v)}
        value={value}
        placeholder='--:--'
        className={delay > 0 ? style.delayedEditable : style.editable}
      >
        <EditablePreview />
        <EditableInput type='time' min='00:00' max='23:59' />
      </Editable>
    </div>
  );
}
