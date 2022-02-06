import React, { useContext, useEffect, useState } from 'react';
import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { forgivingStringToMillis } from '../utils/dateConfig';
import { stringFromMillis } from 'ontime-utils/time';
import style from './EditableTimer.module.css';
import { LoggingContext } from '../../app/context/LoggingContext';
import PropTypes from 'prop-types';

export default function EditableTimer(props) {
  const { name, actionHandler, time, delay, validate, previousEnd } = props;
  const { emitError } = useContext(LoggingContext);
  const [value, setValue] = useState('');

  // prepare time fields
  const validateValue = (value) => {
    const success = handleSubmit(value);
    if (success) {
      const ms = forgivingStringToMillis(value);
      setValue(stringFromMillis(ms + delay));
    } else {
      setValue(stringFromMillis(time + delay));
    }
  };

  useEffect(() => {
    if (time == null) return;
    try {
      setValue(stringFromMillis(time + delay));
    } catch (error) {
      emitError(`Unable to parse date: ${error.text}`);
    }
  }, [time, delay, emitError]);

  const handleSubmit = (value) => {
    // Check if there is anything there
    if (value === '') return false;

    let newValMillis = 0;

    // check for known aliases
    if (value === 'p' || value === 'prev' || value === 'previous') {
      // string to pass should be the time of the end before
      if (previousEnd != null) {
        newValMillis = previousEnd;
      }
    } else if (value.startsWith('+') || value.startsWith('p+') || value.startsWith('p +')) {
      // string to pass should add to the end before
      const val = value.substring(1);
      newValMillis = previousEnd + forgivingStringToMillis(val);
    } else {
      // convert entered value to milliseconds
      newValMillis = forgivingStringToMillis(value);
    }

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

  const isDelayed = delay != null && delay !== 0;

  return (
    <Editable
      data-testid='editable-timer'
      onChange={(v) => setValue(v)}
      onSubmit={(v) => validateValue(v)}
      onCancel={() => setValue(stringFromMillis(time + delay, true))}
      value={value}
      className={isDelayed ? style.delayedEditable : style.editable}
    >
      <EditablePreview />
      <EditableInput type='text' placeholder='--:--:--' data-testid='editable-timer-input' />
    </Editable>
  );
}

EditableTimer.propTypes = {
  name: PropTypes.string.isRequired,
  actionHandler: PropTypes.func.isRequired,
  time: PropTypes.number,
  delay: PropTypes.number,
  validate: PropTypes.func.isRequired,
  previousEnd: PropTypes.number,
};
