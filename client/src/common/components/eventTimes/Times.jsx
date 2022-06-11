import React from 'react';
import PropTypes from 'prop-types';

import EditableTimer from '../../input/EditableTimer';

import style from './Times.module.scss'

export default function Times(props) {
  const { handleValidate, actionHandler, timeStart, timeEnd, duration, previousEnd } = props;

  return (
    <>
      <span className={style.label}>Start</span>
      <EditableTimer
        name='timeStart'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeStart}
        delay={0}
        previousEnd={previousEnd}
      />
      <span className={style.label}>End</span>
      <EditableTimer
        name='timeEnd'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeEnd}
        delay={0}
        previousEnd={previousEnd}
      />
      <span className={style.label}>Duration</span>
      <EditableTimer
        name='durationOverride'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={duration}
        delay={0}
        previousEnd={previousEnd}
      />
    </>
  );
};

Times.propTypes = {
  handleValidate: PropTypes.func.isRequired,
  actionHandler: PropTypes.func.isRequired,
  timeStart: PropTypes.number,
  timeEnd: PropTypes.number,
  duration: PropTypes.number,
  previousEnd: PropTypes.number,
};
