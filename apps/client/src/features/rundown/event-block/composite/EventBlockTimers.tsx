import { memo } from 'react';
import { Tooltip } from '@chakra-ui/react';
import { IoAlertCircleOutline } from '@react-icons/all-files/io5/IoAlertCircleOutline';
import { MaybeNumber, OntimeEvent } from 'ontime-types';
import { calculateDuration } from 'ontime-utils';

import TimeInputWithButton from '../../../../common/components/input/time-input/TimeInputWithButton';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { tooltipDelayFast } from '../../../../ontimeConfig';

import style from '../EventBlock.module.scss';

interface EventBlockTimerProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  delay: number;
  previousEnd: MaybeNumber;
}

type TimeActions = 'timeStart' | 'timeEnd' | 'durationOverride' | 'timeWarning' | 'timeDanger';

const EventBlockTimers = (props: EventBlockTimerProps) => {
  const { eventId, timeStart, timeEnd, duration, delay, previousEnd } = props;
  const { updateEvent } = useEventAction();

  const handleSubmit = (field: TimeActions, value: number) => {
    const newEventData: Partial<OntimeEvent> = { id: eventId };
    switch (field) {
      case 'durationOverride': {
        // duration defines timeEnd
        newEventData.duration = value;
        newEventData.timeEnd = timeStart + value;
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

  const overMidnight = timeStart > timeEnd;

  return (
    <div className={style.eventTimers}>
      <TimeInputWithButton
        name='timeStart'
        submitHandler={handleSubmit}
        time={timeStart}
        delay={delay}
        placeholder='Start'
        previousEnd={previousEnd ?? 0}
      />
      <TimeInputWithButton
        name='timeEnd'
        submitHandler={handleSubmit}
        time={timeEnd}
        delay={delay}
        placeholder='End'
        previousEnd={previousEnd ?? 0}
      />
      <TimeInputWithButton
        name='durationOverride'
        submitHandler={handleSubmit}
        time={duration}
        delay={0}
        placeholder='Duration'
        previousEnd={previousEnd ?? 0}
      />
      {overMidnight && (
        <div className={style.timerNote}>
          <Tooltip
            label='End timer before start '
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
