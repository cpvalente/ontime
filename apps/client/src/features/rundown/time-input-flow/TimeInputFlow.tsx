import { memo } from 'react';
import { IoAlertCircleOutline } from '@react-icons/all-files/io5/IoAlertCircleOutline';
import { IoLink } from '@react-icons/all-files/io5/IoLink';
import { IoLockClosed } from '@react-icons/all-files/io5/IoLockClosed';
import { IoLockOpenOutline } from '@react-icons/all-files/io5/IoLockOpenOutline';
import { IoUnlink } from '@react-icons/all-files/io5/IoUnlink';
import { MaybeString, TimeStrategy } from 'ontime-types';

import TimeInputWithButton from '../../../common/components/input/time-input/TimeInputWithButton';
import { useEventAction } from '../../../common/hooks/useEventAction';
import { cx } from '../../../common/utils/styleUtils';
import { Button } from '../../../components/ui/button';
import { Tooltip } from '../../../components/ui/tooltip';
import { tooltipDelayFast, tooltipDelayMid } from '../../../ontimeConfig';

import style from './TimeInputFlow.module.scss';

interface EventBlockTimerProps {
  eventId: string;
  isTimeToEnd: boolean;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: MaybeString;
  delay: number;
}

type TimeActions = 'timeStart' | 'timeEnd' | 'duration';

function TimeInputFlow(props: EventBlockTimerProps) {
  const { eventId, isTimeToEnd, timeStart, timeEnd, duration, timeStrategy, linkStart, delay } = props;
  const { updateEvent, updateTimer } = useEventAction();

  // In sync with EventEditorTimes
  const handleSubmit = (field: TimeActions, value: string) => {
    updateTimer(eventId, field, value);
  };

  const handleChangeStrategy = (timeStrategy: TimeStrategy) => {
    updateEvent({ id: eventId, timeStrategy });
  };

  const handleLink = (doLink: boolean) => {
    updateEvent({ id: eventId, linkStart: doLink ? 'true' : null });
  };

  const warnings = [];
  if (timeStart > timeEnd) {
    warnings.push('Over midnight');
  }

  if (isTimeToEnd) {
    warnings.push('Target event scheduled end');
  }

  const hasDelay = delay !== 0;

  const isLockedEnd = timeStrategy === TimeStrategy.LockEnd;
  const isLockedDuration = timeStrategy === TimeStrategy.LockDuration;

  const activeStart = cx([style.timeAction, linkStart ? style.active : null]);
  const activeEnd = cx([style.timeAction, isLockedEnd ? style.active : null]);
  const activeDuration = cx([style.timeAction, isLockedDuration ? style.active : null]);

  return (
    <>
      <TimeInputWithButton<TimeActions>
        name='timeStart'
        submitHandler={handleSubmit}
        time={timeStart}
        hasDelay={hasDelay}
        placeholder='Start'
        disabled={Boolean(linkStart)}
        endElement={
          <Tooltip content='Link start to previous end' openDelay={tooltipDelayMid}>
            <Button className={activeStart} onClick={() => handleLink(!linkStart)}>
              <span className={style.timeLabel}>S</span>
              <span className={style.fourtyfive}>{linkStart ? <IoLink /> : <IoUnlink />}</span>
            </Button>
          </Tooltip>
        }
      />

      <TimeInputWithButton<TimeActions>
        name='timeEnd'
        submitHandler={handleSubmit}
        time={timeEnd}
        hasDelay={hasDelay}
        disabled={isLockedDuration}
        placeholder='End'
        endElement={
          <Tooltip content='Lock end' openDelay={tooltipDelayMid}>
            <Button
              className={activeEnd}
              onClick={() => handleChangeStrategy(TimeStrategy.LockEnd)}
              data-testid='lock__end'
            >
              <span className={style.timeLabel}>E</span>
              {isLockedEnd ? <IoLockClosed /> : <IoLockOpenOutline />}
            </Button>
          </Tooltip>
        }
      />

      <TimeInputWithButton<TimeActions>
        name='duration'
        submitHandler={handleSubmit}
        time={duration}
        disabled={isLockedEnd}
        placeholder='Duration'
        endElement={
          <Tooltip content='Lock duration' openDelay={tooltipDelayMid}>
            <Button
              className={activeDuration}
              onClick={() => handleChangeStrategy(TimeStrategy.LockDuration)}
              data-testid='lock__duration'
            >
              <span className={style.timeLabel}>D</span>
              {isLockedDuration ? <IoLockClosed /> : <IoLockOpenOutline />}
            </Button>
          </Tooltip>
        }
      />

      {warnings.length > 0 && (
        <div className={style.timerNote}>
          <Tooltip
            content={warnings.join(' - ')}
            openDelay={tooltipDelayFast}
            variant='ontime-ondark'
            shouldWrapChildren
          >
            <IoAlertCircleOutline />
          </Tooltip>
        </div>
      )}
    </>
  );
}

export default memo(TimeInputFlow);
