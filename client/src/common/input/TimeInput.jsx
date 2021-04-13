import { Editable, EditableInput, EditablePreview } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import style from './TimeInput.module.css';

const inputProps = {
  width: 20,
  backgroundColor: '#fff5',
  placeholder: '-',
  textAlign: 'center',
};

export default function TimeInput(props) {
  const [value, setValue] = useState(props.value);

  useEffect(() => {
    if (props.value === null) return;
    setValue(props.value);
  }, [props.value]);

  const handleChange = (val) => {
    if (val <= 999) setValue(val);
  };

  const handleSubmit = (val) => {
    if (val === props.value) return;
    if (val === '') setValue(0);
    if (val > 0 && val < 60) {
      props.submitHandler(val);
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
      <span className={style.label}>{'(min)'}</span>
    </div>
  );
}
