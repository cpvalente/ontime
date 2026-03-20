import { EndAction, TimeStrategy, TimerType } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';
import { memo } from 'react';
import { IoInformationCircle } from 'react-icons/io5';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import Select, { type SelectOption } from '../../../../common/components/select/Select';
import Switch from '../../../../common/components/switch/Switch';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';
import { millisToDelayString } from '../../../../common/utils/dateConfig';
import TimeInputFlow from '../../time-input-flow/TimeInputFlow';
import { BooleanTally, switchLabel } from '../multi-edit/multiEditUtils';

import style from '../EntryEditor.module.scss';

interface EventEditorTimesMultiEdit {
  endActionIndeterminate: boolean;
  countToEndIndeterminate: boolean;
  countToEndTally: BooleanTally;
  timerTypeIndeterminate: boolean;
  timeWarningIndeterminate: boolean;
  timeDangerIndeterminate: boolean;
  // TimeInputFlow passthrough
  linkStartIndeterminate: boolean;
  durationLockIndeterminate: boolean;
  allLockDuration: boolean;
  allLockEnd: boolean;
}

interface EventEditorTimesProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration?: number;
  timeStrategy: TimeStrategy;
  linkStart: boolean;
  countToEnd: boolean;
  delay: number;
  endAction: EndAction;
  timerType: TimerType;
  timeWarning: number;
  timeDanger: number;
  onSubmit?: (field: string, value: string | boolean) => void;
  multiEdit?: EventEditorTimesMultiEdit;
  onStrategyChange?: (strategy: TimeStrategy) => void;
}

type HandledActions = 'countToEnd' | 'timerType' | 'endAction' | 'timeWarning' | 'timeDanger';

export default memo(EventEditorTimes);
function EventEditorTimes({
  eventId,
  timeStart,
  timeEnd,
  duration,
  timeStrategy,
  linkStart,
  countToEnd,
  delay,
  endAction,
  timerType,
  timeWarning,
  timeDanger,
  onSubmit: onSubmitProp,
  multiEdit,
  onStrategyChange,
}: EventEditorTimesProps) {
  const { updateEntry } = useEntryActionsContext();

  const handleSubmit = (field: HandledActions, value: string | boolean) => {
    if (onSubmitProp) {
      onSubmitProp(field, value);
      return;
    }

    if (field === 'countToEnd') {
      updateEntry({ id: eventId, countToEnd: value as boolean });
      return;
    }

    if (field === 'timeWarning' || field === 'timeDanger') {
      const newTime = parseUserTime(value as string);
      updateEntry({ id: eventId, [field]: newTime });
      return;
    }

    if (field === 'timerType' || field === 'endAction') {
      updateEntry({ id: eventId, [field]: value });
      return;
    }
  };

  const hasDelay = delay !== 0;
  const delayLabel = hasDelay
    ? `Event is ${millisToDelayString(delay, 'expanded')}. New schedule ${millisToString(
        timeStart + delay,
      )} → ${millisToString(timeEnd + delay)}`
    : '';

  const endActionOptions: SelectOption<EndAction | null>[] = [
    ...(multiEdit?.endActionIndeterminate ? [{ value: null, label: 'Mixed' }] : []),
    { value: EndAction.None, label: 'None' },
    { value: EndAction.LoadNext, label: 'Load next event' },
    { value: EndAction.PlayNext, label: 'Play next event' },
  ];

  const timerTypeOptions: SelectOption<TimerType | null>[] = [
    ...(multiEdit?.timerTypeIndeterminate ? [{ value: null, label: 'Mixed' }] : []),
    { value: TimerType.CountDown, label: 'Count down' },
    { value: TimerType.CountUp, label: 'Count up' },
    { value: TimerType.Clock, label: 'Clock' },
    { value: TimerType.None, label: 'None' },
  ];

  return (
    <>
      <div className={style.column}>
        <Editor.Title>Event schedule</Editor.Title>
        <div>
          <div className={style.inline}>
            <TimeInputFlow
              eventId={eventId}
              timeStart={timeStart}
              timeEnd={timeEnd}
              duration={duration}
              timeStrategy={timeStrategy}
              linkStart={linkStart}
              delay={delay}
              countToEnd={countToEnd}
              showLabels
              handleSubmit={onSubmitProp}
              multiEdit={
                multiEdit
                  ? {
                      linkStartIndeterminate: multiEdit.linkStartIndeterminate,
                      durationLockIndeterminate: multiEdit.durationLockIndeterminate,
                      allLockDuration: multiEdit.allLockDuration,
                      allLockEnd: multiEdit.allLockEnd,
                    }
                  : undefined
              }
              onStrategyChange={onStrategyChange}
            />
          </div>
          <div className={style.delayLabel}>{!multiEdit ? delayLabel : ''}</div>
        </div>
      </div>

      <div className={style.column}>
        <Editor.Title>Event Behaviour</Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='endAction'>End Action</Editor.Label>
            <Select<EndAction | null>
              value={multiEdit?.endActionIndeterminate ? null : endAction}
              onValueChange={(value) => {
                if (value === null) return;
                handleSubmit('endAction', value);
              }}
              options={endActionOptions}
            />
          </div>
          <div>
            <Editor.Label htmlFor='countToEnd'>Count to End</Editor.Label>
            <Editor.Label className={style.switchLabel}>
              <Switch
                id='countToEnd'
                checked={countToEnd}
                onCheckedChange={(value) => {
                  if (multiEdit?.countToEndIndeterminate) {
                    handleSubmit('countToEnd', multiEdit.countToEndTally.majority);
                  } else {
                    handleSubmit('countToEnd', value);
                  }
                }}
                indeterminate={multiEdit?.countToEndIndeterminate}
              />
              {multiEdit
                ? switchLabel(multiEdit.countToEndTally, multiEdit.countToEndIndeterminate, countToEnd)
                : countToEnd
                  ? 'On'
                  : 'Off'}
            </Editor.Label>
          </div>
        </div>
      </div>

      <div className={style.column}>
        <Editor.Title>
          <Tooltip
            text='Changes how the timer is displayed in different views. It is not reflected in the rundown'
            render={<span />}
          >
            Display Options
            <IoInformationCircle className={style.tooltipIcon} />
          </Tooltip>
        </Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='timerType'>Timer Type</Editor.Label>
            <Select<TimerType | null>
              value={multiEdit?.timerTypeIndeterminate ? null : timerType}
              onValueChange={(value) => {
                if (value === null) return;
                handleSubmit('timerType', value);
              }}
              options={timerTypeOptions}
            />
          </div>

          <div className={style.inline}>
            <div>
              <Editor.Label htmlFor='timeWarning'>Warning Time</Editor.Label>
              <TimeInput
                id='timeWarning'
                name='timeWarning'
                submitHandler={handleSubmit}
                time={multiEdit?.timeWarningIndeterminate ? undefined : timeWarning}
                placeholder={multiEdit?.timeWarningIndeterminate ? 'multiple' : 'Duration'}
              />
            </div>
            <div>
              <Editor.Label htmlFor='timeDanger'>Danger Time</Editor.Label>
              <TimeInput
                id='timeDanger'
                name='timeDanger'
                submitHandler={handleSubmit}
                time={multiEdit?.timeDangerIndeterminate ? undefined : timeDanger}
                placeholder={multiEdit?.timeDangerIndeterminate ? 'multiple' : 'Duration'}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
