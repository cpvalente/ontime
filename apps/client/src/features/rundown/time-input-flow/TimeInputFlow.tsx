import { memo } from 'react';
import { InputRightElement, Tooltip } from '@chakra-ui/react';
import { IoAlertCircleOutline } from '@react-icons/all-files/io5/IoAlertCircleOutline';
import { IoLink } from '@react-icons/all-files/io5/IoLink';
import { IoLockClosed } from '@react-icons/all-files/io5/IoLockClosed';
import { IoLockOpenOutline } from '@react-icons/all-files/io5/IoLockOpenOutline';
import { IoUnlink } from '@react-icons/all-files/io5/IoUnlink';
import { MaybeString, TimerType, TimeStrategy } from 'ontime-types';

import TimeInputWithButton from '../../../common/components/input/time-input/TimeInputWithButton';
import { useEventAction } from '../../../common/hooks/useEventAction';
import { cx } from '../../../common/utils/styleUtils';
import { tooltipDelayFast, tooltipDelayMid } from '../../../ontimeConfig';
import Freezable from '../freezable/Freezable';

import style from './TimeInputFlow.module.scss';

interface EventBlockTimerProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: MaybeString;
  delay: number;
  timerType: TimerType;
}

type TimeActions = 'timeStart' | 'timeEnd' | 'duration';

const TimeInputFlow = (props: EventBlockTimerProps) => {
  const { eventId, timeStart, timeEnd, duration, timeStrategy, linkStart, delay, timerType } = props;
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

  if (timerType === TimerType.TimeToEnd) {
    warnings.push('Time to end');
  }

  const hasDelay = delay !== 0;

  const isLockedEnd = timeStrategy === TimeStrategy.LockEnd;
  const isLockedDuration = timeStrategy === TimeStrategy.LockDuration;

  const activeStart = cx([style.timeAction, linkStart ? style.active : null]);
  const activeEnd = cx([style.timeAction, isLockedEnd ? style.active : null]);
  const activeDuration = cx([style.timeAction, isLockedDuration ? style.active : null]);

  return (
    <>
      <Freezable>
        <TimeInputWithButton<TimeActions>
          name='timeStart'
          submitHandler={handleSubmit}
          time={timeStart}
          hasDelay={hasDelay}
          placeholder='Start'
          disabled={Boolean(linkStart)}
        >
          <Tooltip label='Link start to previous end' openDelay={tooltipDelayMid}>
            <InputRightElement className={activeStart} onClick={() => handleLink(!linkStart)} as='button'>
              <span className={style.timeLabel}>S</span>
              <span className={style.fourtyfive}>{linkStart ? <IoLink /> : <IoUnlink />}</span>
            </InputRightElement>
          </Tooltip>
        </TimeInputWithButton>
      </Freezable>

      <Freezable>
        <TimeInputWithButton<TimeActions>
          name='timeEnd'
          submitHandler={handleSubmit}
          time={timeEnd}
          hasDelay={hasDelay}
          disabled={isLockedDuration}
          placeholder='End'
        >
          <Tooltip label='Lock end' openDelay={tooltipDelayMid}>
            <InputRightElement
              className={activeEnd}
              onClick={() => handleChangeStrategy(TimeStrategy.LockEnd)}
              data-testid='lock__end'
              as='button'
            >
              <span className={style.timeLabel}>E</span>
              {isLockedEnd ? <IoLockClosed /> : <IoLockOpenOutline />}
            </InputRightElement>
          </Tooltip>
        </TimeInputWithButton>
      </Freezable>

      <Freezable>
        <TimeInputWithButton<TimeActions>
          name='duration'
          submitHandler={handleSubmit}
          time={duration}
          disabled={isLockedEnd}
          placeholder='Duration'
        >
          <Tooltip label='Lock duration' openDelay={tooltipDelayMid}>
            <InputRightElement
              className={activeDuration}
              onClick={() => handleChangeStrategy(TimeStrategy.LockDuration)}
              as='button'
              data-testid='lock__duration'
            >
              <span className={style.timeLabel}>D</span>
              {isLockedDuration ? <IoLockClosed /> : <IoLockOpenOutline />}
            </InputRightElement>
          </Tooltip>
        </TimeInputWithButton>
      </Freezable>

      {warnings.length > 0 && (
        <div className={style.timerNote}>
          <Tooltip label={warnings.join(' - ')} openDelay={tooltipDelayFast} variant='ontime-ondark' shouldWrapChildren>
            <IoAlertCircleOutline />
          </Tooltip>
        </div>
      )}
    </>
  );
};

export default memo(TimeInputFlow);
