import React, { useCallback, useEffect, useState } from 'react';
import { Editable, EditableInput, EditablePreview } from '@chakra-ui/react';
import PropTypes from 'prop-types';

import { clamp } from '../../utils/math';

import style from './TimeInput.module.css';

const inputProps = {
  width: 20,
  fontWeight: 400,
  backgroundColor: 'rgba(0,0,0,0.05)',
  color: '#fff',
  border: '1px solid #ecc94b55',
  borderRadius: '8px',
  placeholder: '-',
  textAlign: 'center',
};

export default function DelayInput(props) {
  const { actionHandler, value } = props;
  const [_value, setValue] = useState(value);

  useEffect(() => {
    if (value == null) return;
    setValue(value);
  }, [value]);

  const handleSubmit = useCallback(
    (newValue) => {
      if (newValue === value) return;
      if (newValue === '') setValue(0);

      // convert to ms and updates
      const msVal = clamp(newValue, -60, 60) * 60000;
      actionHandler('update', { field: 'duration', value: msVal });
    },
    [actionHandler, value]
  );

  const labelText = `minutes ${value >= 0 ? 'delayed' : 'ahead'}`;

  return (
    <div className={style.timeInput}>
      <Editable
        {...inputProps}
        value={_value}
        onChange={(v) => setValue(v)}
        onSubmit={(v) => handleSubmit(v)}
      >
        <EditablePreview />
        <EditableInput type='number' min='-60' max='60' />
      </Editable>
      <span className={style.label}>{labelText}</span>
    </div>
  );
}

DelayInput.propTypes = {
  actionHandler: PropTypes.func,
  value: PropTypes.number,
};
