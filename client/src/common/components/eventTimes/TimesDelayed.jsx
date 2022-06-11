import React from 'react';
import PropTypes from 'prop-types';

import EditableTimer from '../../input/EditableTimer';
import { stringFromMillis } from '../../utils/time';

import style from './Times.module.scss'

export default function TimesDelayed(props) {
  const { handleValidate, actionHandler, delay, timeStart, timeEnd, duration, previousEnd } = props;

  const scheduledStart = stringFromMillis(timeStart, false);
  const scheduledEnd = stringFromMillis(timeEnd, false);

  return (
    <>
      <span className={style.label}>
        Start <span>{scheduledStart}</span>
      </span>
      <EditableTimer
        name='timeStart'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeStart}
        delay={delay}
        previousEnd={previousEnd}
      />
      <span className={style.label}>
        End <span>{scheduledEnd}</span>
      </span>
      <EditableTimer
        name='timeEnd'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeEnd}
        delay={delay}
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

TimesDelayed.propTypes = {
  handleValidate: PropTypes.func.isRequired,
  actionHandler: PropTypes.func.isRequired,
  delay: PropTypes.number,
  timeStart: PropTypes.number,
  timeEnd: PropTypes.number,
  duration: PropTypes.number,
  previousEnd: PropTypes.number,
};
