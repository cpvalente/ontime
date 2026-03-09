import { memo } from 'react';
import { FaQuestion } from 'react-icons/fa6';
import { IoAlertCircleOutline, IoLink, IoLockClosed, IoLockOpenOutline, IoUnlink } from 'react-icons/io5';
import { TimeField, TimeStrategy } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

import IconButton from '../../../common/components/buttons/IconButton';
import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import TimeInput from '../../../common/components/input/time-input/TimeInput';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import { useEntryActionsContext } from '../../../common/context/EntryActionsContext';

import TimeInputGroup from './TimeInputGroup';

import style from './TimeInputFlow.module.scss';

interface TimeInputFlowMultiEdit {
  linkStartIndeterminate: boolean;
  durationLockIndeterminate: boolean;
  allLockDuration: boolean;
  allLockEnd: boolean;
}

interface TimeInputFlowProps {
  eventId: string;
  countToEnd: boolean;
  timeStart: number;
  timeEnd: number;
  duration?: number;
  timeStrategy: TimeStrategy;
  linkStart: boolean;
  delay: number;
  showLabels?: boolean;
  handleSubmit?: (field: string, value: string | boolean) => void;
  multiEdit?: TimeInputFlowMultiEdit;
  onStrategyChange?: (strategy: TimeStrategy) => void;
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
  handleSubmit: handleSubmitProp,
  multiEdit,
  onStrategyChange,
}: TimeInputFlowProps) {
  const { updateEntry, updateTimer } = useEntryActionsContext();

  // In sync with EventEditorTimes
  const handleTimeSubmit = (field: TimeField, value: string) => {
    if (handleSubmitProp) {
      handleSubmitProp(field, value);
    } else {
      updateTimer(eventId, field, value);
    }
  };

  const handleChangeStrategy = (strategy: TimeStrategy) => {
    if (onStrategyChange) {
      onStrategyChange(strategy);
    } else {
      updateEntry({ id: eventId, timeStrategy: strategy });
    }
  };

  const handleLink = (doLink: boolean) => {
    if (handleSubmitProp) {
      handleSubmitProp('linkStart', doLink);
    } else {
      updateEntry({ id: eventId, linkStart: doLink });
    }
  };

  const warnings = [];
  if (duration != null && timeStart + duration > dayInMs) {
    warnings.push('Over midnight');
  }

  if (countToEnd) {
    warnings.push('Count to End');
  }

  const hasDelay = delay !== 0;
  const isLockedEnd = multiEdit ? multiEdit.allLockEnd : timeStrategy === TimeStrategy.LockEnd;
  const isLockedDuration = multiEdit ? multiEdit.allLockDuration : timeStrategy === TimeStrategy.LockDuration;

  return (
    <>
      <div className={style.inputWrapper}>
        {showLabels && <Editor.Label className={style.sectionTitle}>Start time</Editor.Label>}
        <Editor.Label className={style.hoverLabel}>Start</Editor.Label>
        <TimeInputGroup hasDelay={hasDelay}>
          {multiEdit ? (
            <span className={style.disabledInput}>&mdash;</span>
          ) : (
            <TimeInput
              name='timeStart'
              submitHandler={handleTimeSubmit}
              time={timeStart}
              placeholder='Start'
              align='left'
              disabled={linkStart}
            />
          )}
          <Tooltip
            text='Link start to previous end'
            onClick={() => handleLink(!linkStart)}
            render={<IconButton variant='subtle-white' className={linkStart ? style.active : style.inactive} />}
          >
            {multiEdit?.linkStartIndeterminate ? (
              <FaQuestion />
            ) : (
              <span className={style.fourtyfive}>{linkStart ? <IoLink /> : <IoUnlink />}</span>
            )}
          </Tooltip>
        </TimeInputGroup>
      </div>

      <div className={style.inputWrapper}>
        {showLabels && <Editor.Label>End time</Editor.Label>}
        <Editor.Label className={style.hoverLabel}>End</Editor.Label>
        <TimeInputGroup hasDelay={hasDelay}>
          {multiEdit ? (
            <span className={style.disabledInput}>&mdash;</span>
          ) : (
            <TimeInput
              name='timeEnd'
              submitHandler={handleTimeSubmit}
              time={timeEnd}
              placeholder='End'
              align='left'
              disabled={isLockedDuration}
            />
          )}
          <Tooltip
            text='Lock end'
            render={<IconButton variant='subtle-white' className={isLockedEnd ? style.active : style.inactive} />}
            onClick={() => handleChangeStrategy(TimeStrategy.LockEnd)}
            data-testid='lock__end'
          >
            {multiEdit?.durationLockIndeterminate ? (
              <FaQuestion />
            ) : isLockedEnd ? (
              <IoLockClosed />
            ) : (
              <IoLockOpenOutline />
            )}
          </Tooltip>
        </TimeInputGroup>
      </div>

      <div className={style.inputWrapper}>
        {showLabels && <Editor.Label>Duration</Editor.Label>}
        <Editor.Label className={style.hoverLabel}>Duration</Editor.Label>
        <TimeInputGroup hasDelay={hasDelay}>
          {multiEdit && !multiEdit.allLockDuration ? (
            <span className={style.disabledInput}>&mdash;</span>
          ) : (
            <TimeInput
              name='duration'
              submitHandler={handleTimeSubmit}
              time={duration}
              placeholder={multiEdit ? 'multiple' : 'Duration'}
              align='left'
              disabled={isLockedEnd}
            />
          )}
          <Tooltip
            text='Lock duration'
            render={
              <IconButton variant='subtle-white' className={isLockedDuration ? style.active : style.inactive} />
            }
            onClick={() => handleChangeStrategy(TimeStrategy.LockDuration)}
            data-testid='lock__duration'
          >
            {multiEdit?.durationLockIndeterminate ? (
              <FaQuestion />
            ) : isLockedDuration ? (
              <IoLockClosed />
            ) : (
              <IoLockOpenOutline />
            )}
          </Tooltip>
        </TimeInputGroup>
      </div>

      {!multiEdit && warnings.length > 0 && (
        <Tooltip text={warnings.join(' - ')} className={style.timerNote} data-testid='event-warning' render={<span />}>
          <IoAlertCircleOutline />
        </Tooltip>
      )}
    </>
  );
}
