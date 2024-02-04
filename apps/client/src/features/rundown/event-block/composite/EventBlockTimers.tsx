import { memo } from 'react';
import { OntimeEvent } from 'ontime-types';
import { calculateDuration, dayInMs, millisToString } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { millisToDelayString } from '../../../../common/utils/dateConfig';

import style from '../EventBlock.module.scss';

interface EventBlockTimerProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  delay: number;
  previousEnd: number;
}

type TimeActions = 'timeStart' | 'timeEnd' | 'durationOverride';

const EventBlockTimers = (props: EventBlockTimerProps) => {
  const { eventId, timeStart, timeEnd, duration, delay, previousEnd } = props;
  const { updateEvent } = useEventAction();

  const handleSubmit = (field: TimeActions, value: number) => {
    const newEventData: Partial<OntimeEvent> = { id: eventId };
    switch (field) {
      case 'durationOverride': {
        // duration defines timeEnd
        newEventData.duration = value;
        newEventData.timeEnd = timeStart + ((value as number) % dayInMs);
        break;
      }
      case 'timeStart': {
        newEventData.duration = calculateDuration(value, timeEnd);
        newEventData.timeStart = value;
        break;
      }
      case 'timeEnd': {
        newEventData.duration = calculateDuration(timeStart, value);
        newEventData.timeEnd = value;
        break;
      }
    }
    updateEvent(newEventData);
  };

  const delayedStart = Math.max(0, timeStart + delay);
  const newTime = millisToString(delayedStart);
  const delayTime = delay !== 0 ? millisToDelayString(delay) : null;

  return (
    <div className={style.eventTimers}>
      <TimeInput
        name='timeStart'
        submitHandler={handleSubmit}
        time={timeStart}
        delay={delay}
        placeholder='Start'
        previousEnd={previousEnd}
      />
      <TimeInput
        name='timeEnd'
        submitHandler={handleSubmit}
        time={timeEnd}
        delay={delay}
        placeholder='End'
        previousEnd={previousEnd}
      />
      <TimeInput
        name='durationOverride'
        submitHandler={handleSubmit}
        time={duration}
        delay={0}
        placeholder='Duration'
        previousEnd={previousEnd}
      />
      {delayTime && (
        <div className={style.delayNote}>
          {delayTime}
          <br />
          {`New start: ${newTime}`}
        </div>
      )}
    </div>
  );
};

export default memo(EventBlockTimers);
