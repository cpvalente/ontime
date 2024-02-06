import { memo, useState } from 'react';
import { InputRightElement, Tooltip } from '@chakra-ui/react';
import { IoAlertCircleOutline } from '@react-icons/all-files/io5/IoAlertCircleOutline';
import { IoLink } from '@react-icons/all-files/io5/IoLink';
import { IoLockClosed } from '@react-icons/all-files/io5/IoLockClosed';
import { IoLockOpenOutline } from '@react-icons/all-files/io5/IoLockOpenOutline';
import { IoUnlink } from '@react-icons/all-files/io5/IoUnlink';
import { OntimeEvent } from 'ontime-types';

import TimeInputWithButton from '../../../../common/components/input/time-input/TimeInputWithButton';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { forgivingStringToMillis } from '../../../../common/utils/dateConfig';
import { cx } from '../../../../common/utils/styleUtils';
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
  const [linkedStart, setLinkedStart] = useState(false);
  const [locked, setLocked] = useState<'timeEnd' | 'duration'>('duration');

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

  const isLockedEnd = locked === 'timeEnd';
  const isLockedDuration = locked === 'duration';

  const activeStart = cx([style.timeAction, linkedStart ? style.active : null]);
  const activeEnd = cx([style.timeAction, isLockedEnd ? style.active : null]);
  const activeDuration = cx([style.timeAction, isLockedDuration ? style.active : null]);

  return (
    <div className={style.eventTimers}>
      <TimeInputWithButton<TimeActions>
        name='timeStart'
        submitHandler={handleSubmit}
        time={timeStart}
        hasDelay={hasDelay}
        placeholder='Start'
        disabled={linkedStart}
      >
        <InputRightElement className={activeStart} onClick={() => setLinkedStart((prev) => !prev)}>
          <span className={style.timeLabel}>S</span>
          <span className={style.fourtyfive}>{linkedStart ? <IoLink /> : <IoUnlink />}</span>
        </InputRightElement>
      </TimeInputWithButton>
      <TimeInputWithButton<TimeActions>
        name='timeEnd'
        submitHandler={handleSubmit}
        time={timeEnd}
        hasDelay={hasDelay}
        disabled={isLockedDuration}
        placeholder='End'
      >
        <InputRightElement className={activeEnd} onClick={() => setLocked('timeEnd')}>
          <span className={style.timeLabel}>E</span>
          {isLockedEnd ? <IoLockClosed /> : <IoLockOpenOutline />}
        </InputRightElement>
      </TimeInputWithButton>
      <TimeInputWithButton<TimeActions>
        name='durationOverride'
        submitHandler={handleSubmit}
        time={duration}
        disabled={isLockedEnd}
        placeholder='Duration'
      >
        <InputRightElement className={activeDuration} onClick={() => setLocked('duration')}>
          <span className={style.timeLabel}>D</span>
          {isLockedDuration ? <IoLockClosed /> : <IoLockOpenOutline />}
        </InputRightElement>
      </TimeInputWithButton>
      {overMidnight && (
        <div className={style.timerNote}>
          <Tooltip
            label='Over midnight: end time is before start'
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
