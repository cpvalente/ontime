import { Editable, EditableInput, EditablePreview } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import style from './TimeInput.module.css';

const inputProps = {
  width: 20,
  fontWeight: 400,
  backgroundColor: 'rgba(0,0,0,0.05)',
  color: '#fff',
  border: '1px solid #ecc94b55',
  borderRadius: '4px',
  placeholder: '-',
  textAlign: 'center',
};

export default function DelayInput(props) {
  const [value, setValue] = useState(props.value);

  useEffect(() => {
    if (props.value == null) return;
    setValue(props.value);
  }, [props.value]);

  const handleChange = (val) => {
    if (val <= 666) setValue(val);
  };

  const handleSubmit = (val) => {
    if (val === props.value) return;
    if (val === '') setValue(0);
    if (val >= 0 && val <= 60) {
      // convert to ms and updates
      props.actionHandler('update', { field: 'duration', value: val * 60000 });
    } else {
      props.actionHandler('update', { field: 'duration', value: 3600000 });
    }
  };

  return (
    <div className={style.timeInput}>
      <Editable
        {...inputProps}
        value={value}
        onChange={(v) => handleChange(v)}
        onSubmit={(v) => handleSubmit(v)}
      >
        <EditablePreview />
        <EditableInput type='number' min='0' max='60' />
      </Editable>
      <span className={style.label}>{'minutes'}</span>
    </div>
  );
}
