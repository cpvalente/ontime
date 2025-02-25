import { memo } from 'react';
import { IoAlertCircleOutline } from 'react-icons/io5';
import { IoLink } from 'react-icons/io5';
import { IoLockClosed } from 'react-icons/io5';
import { IoLockOpenOutline } from 'react-icons/io5';
import { IoUnlink } from 'react-icons/io5';
import { MaybeString, TimeField, TimeStrategy } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

import TimeInputWithButton from '../../../common/components/input/time-input/TimeInputWithButton';
import { Button } from '../../../common/components/ui/button';
import { Tooltip } from '../../../common/components/ui/tooltip';
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
  linkStart: MaybeString;
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
    updateEvent({ id: eventId, linkStart: doLink ? 'true' : null });
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

  const activeStart = cx([style.timeAction, linkStart ? style.active : null]);
  const activeEnd = cx([style.timeAction, isLockedEnd ? style.active : null]);
  const activeDuration = cx([style.timeAction, isLockedDuration ? style.active : null]);

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
          disabled={Boolean(linkStart)}
          endElement={
            <Tooltip content='Link start to previous end' openDelay={tooltipDelayMid}>
              <Button className={activeStart} onClick={() => handleLink(!linkStart)} size='2xs'>
                <span className={style.timeLabel}>S</span>
                <span className={style.fourtyfive}>{linkStart ? <IoLink /> : <IoUnlink />}</span>
              </Button>
            </Tooltip>
          }
        />
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
          endElement={
            <Tooltip content='Lock end' openDelay={tooltipDelayMid}>
              <Button
                className={activeEnd}
                onClick={() => handleChangeStrategy(TimeStrategy.LockEnd)}
                data-testid='lock__end'
                size='2xs'
              >
                <span className={style.timeLabel}>E</span>
                {isLockedEnd ? <IoLockClosed /> : <IoLockOpenOutline />}
              </Button>
            </Tooltip>
          }
        />
      </div>

      <div>
        {showLabels && <Editor.Label>Duration</Editor.Label>}
        <TimeInputWithButton<TimeField>
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
                size='2xs'
              >
                <span className={style.timeLabel}>D</span>
                {isLockedDuration ? <IoLockClosed /> : <IoLockOpenOutline />}
              </Button>
            </Tooltip>
          }
        />
      </div>

      {warnings.length > 0 && (
        <div className={style.timerNote} data-testid='event-warning'>
          <Tooltip content={warnings.join(' - ')} openDelay={tooltipDelayFast}>
            <IoAlertCircleOutline />
          </Tooltip>
        </div>
      )}
    </>
  );
}

export default memo(TimeInputFlow);
