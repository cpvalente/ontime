import { memo } from 'react';
import { Tooltip } from '@chakra-ui/react';
import { IoAlertCircleOutline } from '@react-icons/all-files/io5/IoAlertCircleOutline';
import { OntimeEvent } from 'ontime-types';

import TimeInputWithButton from '../../../../common/components/input/time-input/TimeInputWithButton';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { forgivingStringToMillis } from '../../../../common/utils/dateConfig';
import { tooltipDelayFast } from '../../../../ontimeConfig';

import style from '../EventBlock.module.scss';

interface EventBlockTimerProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  delay: number;
}

type TimeActions = 'timeStart' | 'timeEnd' | 'durationOverride'; // we call it durationOverride to stop from passing as a duration value

const EventBlockTimers = (props: EventBlockTimerProps) => {
  const { eventId, timeStart, timeEnd, duration, delay } = props;
  const { updateEvent, updateTimer } = useEventAction();

  // In sync with EventEditorTimes
  const handleSubmit = (field: TimeActions, value: string) => {
    if (field === 'timeStart' || field === 'timeEnd') {
      updateTimer(eventId, field, value);
      return;
    }

    if (field === 'durationOverride') {
      const timeInMillis = forgivingStringToMillis(value);
      const newEventData: Partial<OntimeEvent> = { id: eventId, timeEnd: timeStart + timeInMillis };
      updateEvent(newEventData);
      return;
    }
  };

  const overMidnight = timeStart > timeEnd;
  const hasDelay = delay !== 0;

  return (
    <div className={style.eventTimers}>
      <TimeInputWithButton<TimeActions>
        name='timeStart'
        submitHandler={handleSubmit}
        time={timeStart}
        hasDelay={hasDelay}
        placeholder='Start'
      />
      <TimeInputWithButton<TimeActions>
        name='timeEnd'
        submitHandler={handleSubmit}
        time={timeEnd}
        hasDelay={hasDelay}
        placeholder='End'
      />
      <TimeInputWithButton<TimeActions>
        name='durationOverride'
        submitHandler={handleSubmit}
        time={duration}
        placeholder='Duration'
      />
      {overMidnight && (
        <div className={style.timerNote}>
          <Tooltip
            label='End timer before start'
            openDelay={tooltipDelayFast}
            variant='ontime-ondark'
            shouldWrapChildren
          >
            <IoAlertCircleOutline />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default memo(EventBlockTimers);
