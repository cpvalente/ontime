import { memo } from 'react';
import { InputRightElement, Tooltip } from '@chakra-ui/react';
import { IoAlertCircleOutline } from '@react-icons/all-files/io5/IoAlertCircleOutline';
import { IoLink } from '@react-icons/all-files/io5/IoLink';
import { IoLockClosed } from '@react-icons/all-files/io5/IoLockClosed';
import { IoLockOpenOutline } from '@react-icons/all-files/io5/IoLockOpenOutline';
import { IoUnlink } from '@react-icons/all-files/io5/IoUnlink';
import { MaybeString, OntimeEvent, TimeStrategy } from 'ontime-types';

import TimeInputWithButton from '../../../common/components/input/time-input/TimeInputWithButton';
import { useEventAction } from '../../../common/hooks/useEventAction';
import { AppMode, useAppMode } from '../../../common/stores/appModeStore';
import { cx } from '../../../common/utils/styleUtils';
import { tooltipDelayFast } from '../../../ontimeConfig';

import style from './TimeInputFlow.module.scss';

interface EventBlockTimerProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: MaybeString;
  delay: number;
}

type TimeActions = 'timeStart' | 'timeEnd' | 'duration';

const TimeInputFlow = (props: EventBlockTimerProps) => {
  const { eventId, timeStart, timeEnd, duration, timeStrategy, linkStart, delay } = props;
  const { updateEvent, updateTimer, linkTimer } = useEventAction();
  const appMode = useAppMode((state) => state.mode);

  // In sync with EventEditorTimes
  const handleSubmit = (field: TimeActions, value: string) => {
    updateTimer(eventId, field, value);
  };

  const handleChangeStrategy = (timeStrategy: TimeStrategy) => {
    const newEvent: Partial<OntimeEvent> = { id: eventId, timeStrategy };
    updateEvent(newEvent);
  };

  const handleLink = (doLink: boolean) => {
    // the string doesnt mean much for now, not more than an intent to link
    // we imagine that we can leverage this to create offsets p+10
    linkTimer(eventId, doLink ? 'p' : null);
  };

  const overMidnight = timeStart > timeEnd;
  const hasDelay = delay !== 0;

  const isLockedEnd = timeStrategy === TimeStrategy.LockEnd;
  const isLockedDuration = timeStrategy === TimeStrategy.LockDuration;

  const activeStart = cx([style.timeAction, linkStart ? style.active : null]);
  const activeEnd = cx([style.timeAction, isLockedEnd ? style.active : null]);
  const activeDuration = cx([style.timeAction, isLockedDuration ? style.active : null]);

  const isRundownFrozen = appMode === AppMode.Freeze;

  return (
    <>
      <TimeInputWithButton<TimeActions>
        name='timeStart'
        submitHandler={handleSubmit}
        time={timeStart}
        hasDelay={hasDelay}
        placeholder='Start'
        disabled={isRundownFrozen || Boolean(linkStart)}
      >
        <InputRightElement
          className={activeStart}
          onClick={() => handleLink(!linkStart)}
          as='button'
          disabled={isRundownFrozen}
        >
          <span className={style.timeLabel}>S</span>
          <span className={style.fourtyfive}>{linkStart ? <IoLink /> : <IoUnlink />}</span>
        </InputRightElement>
      </TimeInputWithButton>

      <TimeInputWithButton<TimeActions>
        name='timeEnd'
        submitHandler={handleSubmit}
        time={timeEnd}
        hasDelay={hasDelay}
        disabled={isRundownFrozen || isLockedDuration}
        placeholder='End'
      >
        <InputRightElement
          as='button'
          className={activeEnd}
          onClick={() => handleChangeStrategy(TimeStrategy.LockEnd)}
          data-testid='lock__end'
          disabled={isRundownFrozen}
        >
          <span className={style.timeLabel}>E</span>
          {isLockedEnd ? <IoLockClosed /> : <IoLockOpenOutline />}
        </InputRightElement>
      </TimeInputWithButton>

      <TimeInputWithButton<TimeActions>
        name='duration'
        submitHandler={handleSubmit}
        time={duration}
        disabled={isRundownFrozen || isLockedEnd}
        placeholder='Duration'
      >
        <InputRightElement
          as='button'
          className={activeDuration}
          onClick={() => handleChangeStrategy(TimeStrategy.LockDuration)}
          data-testid='lock__duration'
          disabled={isRundownFrozen}
        >
          <span className={style.timeLabel}>D</span>
          {isLockedDuration ? <IoLockClosed /> : <IoLockOpenOutline />}
        </InputRightElement>
      </TimeInputWithButton>

      {overMidnight && (
        <div className={style.timerNote}>
          <Tooltip label='Over midnight' openDelay={tooltipDelayFast} variant='ontime-ondark' shouldWrapChildren>
            <IoAlertCircleOutline />
          </Tooltip>
        </div>
      )}
    </>
  );
};

export default memo(TimeInputFlow);
