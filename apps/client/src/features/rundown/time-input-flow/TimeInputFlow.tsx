import { memo } from 'react';
import { IoAlertCircleOutline, IoLink, IoLockClosed, IoLockOpenOutline, IoUnlink } from 'react-icons/io5';
import { InputRightElement, Tooltip } from '@chakra-ui/react';
import { TimeField, TimeStrategy } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

import TimeInputWithButton from '../../../common/components/input/time-input/TimeInputWithButton';
import { useEventAction } from '../../../common/hooks/useEventAction';
import { cx } from '../../../common/utils/styleUtils';
import { tooltipDelayFast, tooltipDelayMid } from '../../../ontimeConfig';
import * as Editor from '../../editors/editor-utils/EditorUtils';

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

function TimeInputFlow(props: EventBlockTimerProps) {
  const { eventId, countToEnd, timeStart, timeEnd, duration, timeStrategy, linkStart, delay, showLabels } = props;
  const { updateEvent, updateTimer } = useEventAction();

  // In sync with EventEditorTimes
  const handleSubmit = (field: TimeField, value: string) => {
    updateTimer(eventId, field, value);
  };

  const handleChangeStrategy = (timeStrategy: TimeStrategy) => {
    updateEvent({ id: eventId, timeStrategy });
  };

  const handleLink = (doLink: boolean) => {
    updateEvent({ id: eventId, linkStart: doLink });
  };

  const warnings = [];
  if (timeStart + duration > dayInMs) {
    warnings.push('Over midnight');
  }

  if (countToEnd) {
    warnings.push('Count to End');
  }

  const hasDelay = delay !== 0;

  const isLockedEnd = timeStrategy === TimeStrategy.LockEnd;
  const isLockedDuration = timeStrategy === TimeStrategy.LockDuration;

  const activeStart = cx([style.timeAction, linkStart && style.active]);
  const activeEnd = cx([style.timeAction, isLockedEnd && style.active]);
  const activeDuration = cx([style.timeAction, isLockedDuration && style.active]);

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

export default memo(TimeInputFlow);
