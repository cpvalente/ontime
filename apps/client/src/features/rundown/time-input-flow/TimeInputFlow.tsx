import { memo } from 'react';
import { IoAlertCircleOutline, IoLink, IoLockClosed, IoLockOpenOutline, IoUnlink } from 'react-icons/io5';
import { TimeField, TimeStrategy } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import TimeInput from '../../../common/components/input/time-input/TimeInput';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { cx } from '../../../common/utils/styleUtils';

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
function TimeInputFlow({
  eventId,
  countToEnd,
  timeStart,
  timeEnd,
  duration,
  timeStrategy,
  linkStart,
  delay,
  showLabels,
}: EventBlockTimerProps) {
  const { updateEntry, updateTimer } = useEntryActions();

  // In sync with EventEditorTimes
  const handleSubmit = (field: TimeField, value: string) => {
    updateTimer(eventId, field, value);
  };

  const handleChangeStrategy = (timeStrategy: TimeStrategy) => {
    updateEntry({ id: eventId, timeStrategy });
  };

  const handleLink = (doLink: boolean) => {
    updateEntry({ id: eventId, linkStart: doLink });
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

  return (
    <>
      <div>
        {showLabels && <Editor.Label className={style.sectionTitle}>Start time</Editor.Label>}
        <div className={cx([style.inputGroup, hasDelay && style.delayed])}>
          <TimeInput
            name='timeStart'
            submitHandler={handleSubmit}
            time={timeStart}
            placeholder='Start'
            align='left'
            disabled={linkStart}
          />
          <Tooltip
            text='Link start to previous end'
            className={cx([style.timeAction, linkStart && style.active])}
            onClick={() => handleLink(!linkStart)}
          >
            <span className={style.fourtyfive}>{linkStart ? <IoLink /> : <IoUnlink />}</span>
          </Tooltip>
        </div>
      </div>

      <div>
        {showLabels && <Editor.Label>End time</Editor.Label>}
        <div className={cx([style.inputGroup, hasDelay && style.delayed])}>
          <TimeInput
            name='timeEnd'
            submitHandler={handleSubmit}
            time={timeEnd}
            placeholder='End'
            align='left'
            disabled={isLockedDuration}
          />
          <Tooltip
            text='Lock end'
            className={cx([style.timeAction, isLockedEnd && style.active])}
            onClick={() => handleChangeStrategy(TimeStrategy.LockEnd)}
            data-testid='lock__end'
          >
            {isLockedEnd ? <IoLockClosed /> : <IoLockOpenOutline />}
          </Tooltip>
        </div>
      </div>

      <div>
        {showLabels && <Editor.Label>Duration</Editor.Label>}
        <div className={cx([style.inputGroup, hasDelay && style.delayed])}>
          <TimeInput
            name='duration'
            submitHandler={handleSubmit}
            time={duration}
            placeholder='Duration'
            align='left'
            disabled={isLockedEnd}
          />
          <Tooltip
            text='Lock duration'
            className={cx([style.timeAction, isLockedDuration && style.active])}
            onClick={() => handleChangeStrategy(TimeStrategy.LockDuration)}
            data-testid='lock__duration'
          >
            {isLockedDuration ? <IoLockClosed /> : <IoLockOpenOutline />}
          </Tooltip>
        </div>
      </div>

      {warnings.length > 0 && (
        <Tooltip text={warnings.join(' - ')} className={style.timerNote} data-testid='event-warning' render={<span />}>
          <IoAlertCircleOutline />
        </Tooltip>
      )}
    </>
  );
}
