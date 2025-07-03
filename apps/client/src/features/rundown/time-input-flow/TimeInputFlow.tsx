import { memo, useCallback, useMemo } from 'react';
import { IoAlertCircleOutline, IoLink, IoLockClosed, IoLockOpenOutline, IoUnlink } from 'react-icons/io5';
import { InputRightElement, Tooltip } from '@chakra-ui/react';
import { TimeField, TimeStrategy } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import TimeInputWithButton from '../../../common/components/input/time-input/TimeInputWithButton';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { cx } from '../../../common/utils/styleUtils';
import { tooltipDelayFast, tooltipDelayMid } from '../../../ontimeConfig';

import style from './TimeInputFlow.module.scss';

interface EventBlockTimerProps {
  eventId: string;
  countToEnd: boolean;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: boolean;
  delay: number;
  showLabels?: boolean;
}

export default memo(TimeInputFlow);
function TimeInputFlow(props: EventBlockTimerProps) {
  const { eventId, countToEnd, timeStart, timeEnd, duration, timeStrategy, linkStart, delay, showLabels } = props;
  const { updateEntry, updateTimer } = useEntryActions();

  // In sync with EventEditorTimes
  const handleSubmit = useCallback(
    (field: TimeField, value: string) => {
      updateTimer(eventId, field, value);
    },
    [eventId, updateTimer],
  );

  const handleChangeStrategy = useCallback(
    (newTimeStrategy: TimeStrategy) => {
      updateEntry({ id: eventId, timeStrategy: newTimeStrategy });
    },
    [eventId, updateEntry],
  );

  const handleLink = useCallback(
    (doLink: boolean) => {
      updateEntry({ id: eventId, linkStart: doLink });
    },
    [eventId, updateEntry],
  );

  const warnings = useMemo(() => {
    const arr = [];
    if (timeStart + duration > dayInMs) {
      arr.push('Over midnight');
    }
    if (countToEnd) {
      arr.push('Count to End');
    }
    return arr;
  }, [timeStart, duration, countToEnd]);

  const hasDelay = delay !== 0; // This is already a simple boolean, no useMemo needed unless delay itself is complex to derive

  const isLockedEnd = timeStrategy === TimeStrategy.LockEnd;
  const isLockedDuration = timeStrategy === TimeStrategy.LockDuration;

  const activeStart = useMemo(() => cx([style.timeAction, linkStart && style.active]), [linkStart]);
  const activeEnd = useMemo(() => cx([style.timeAction, isLockedEnd && style.active]), [isLockedEnd]);
  const activeDuration = useMemo(
    () => cx([style.timeAction, isLockedDuration && style.active]),
    [isLockedDuration],
  );

  return (
    <>
      <div>
        {showLabels && <Editor.Label className={style.sectionTitle}>Start time</Editor.Label>}
        <TimeInputWithButton<TimeField>
          name='timeStart'
          submitHandler={handleSubmit}
          time={timeStart}
          hasDelay={hasDelay}
          placeholder='Start'
          disabled={linkStart}
        >
          <Tooltip label='Link start to previous end' openDelay={tooltipDelayMid}>
            <InputRightElement className={activeStart} onClick={() => handleLink(!linkStart)}>
              <span className={style.timeLabel}>S</span>
              <span className={style.fourtyfive}>{linkStart ? <IoLink /> : <IoUnlink />}</span>
            </InputRightElement>
          </Tooltip>
        </TimeInputWithButton>
      </div>

      <div>
        {showLabels && <Editor.Label>End time</Editor.Label>}
        <TimeInputWithButton<TimeField>
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
            >
              <span className={style.timeLabel}>E</span>
              {isLockedEnd ? <IoLockClosed /> : <IoLockOpenOutline />}
            </InputRightElement>
          </Tooltip>
        </TimeInputWithButton>
      </div>

      <div>
        {showLabels && <Editor.Label>Duration</Editor.Label>}
        <TimeInputWithButton<TimeField>
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
              data-testid='lock__duration'
            >
              <span className={style.timeLabel}>D</span>
              {isLockedDuration ? <IoLockClosed /> : <IoLockOpenOutline />}
            </InputRightElement>
          </Tooltip>
        </TimeInputWithButton>
      </div>

      {warnings.length > 0 && (
        <div className={style.timerNote} data-testid='event-warning'>
          <Tooltip label={warnings.join(' - ')} openDelay={tooltipDelayFast} variant='ontime-ondark' shouldWrapChildren>
            <IoAlertCircleOutline />
          </Tooltip>
        </div>
      )}
    </>
  );
}
