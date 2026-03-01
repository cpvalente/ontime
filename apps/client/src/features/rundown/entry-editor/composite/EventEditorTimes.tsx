import { EndAction, TimeStrategy, TimerType } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';
import { memo } from 'react';
import { IoInformationCircle } from 'react-icons/io5';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import Select from '../../../../common/components/select/Select';
import Switch from '../../../../common/components/switch/Switch';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';
import { millisToDelayString } from '../../../../common/utils/dateConfig';
import TimeInputFlow from '../../time-input-flow/TimeInputFlow';

import style from '../EntryEditor.module.scss';

interface EventEditorTimesProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: boolean;
  countToEnd: boolean;
  delay: number;
  endAction: EndAction;
  timerType: TimerType;
  timeWarning: number;
  timeDanger: number;
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
}: EventEditorTimesProps) {
  const { updateEntry } = useEntryActionsContext();

  const handleSubmit = (field: HandledActions, value: string | boolean) => {
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
            />
          </div>
          <div className={style.delayLabel}>{delayLabel}</div>
        </div>
      </div>

      <div className={style.column}>
        <Editor.Title>Event Behaviour</Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='endAction'>End Action</Editor.Label>
            <Select
              value={endAction}
              onValueChange={(value: EndAction | null) => {
                if (value === null) return;
                handleSubmit('endAction', value);
              }}
              options={[
                { value: EndAction.None, label: 'None' },
                { value: EndAction.LoadNext, label: 'Load next event' },
                { value: EndAction.PlayNext, label: 'Play next event' },
              ]}
            />
          </div>
          <div>
            <Editor.Label htmlFor='countToEnd'>Count to End</Editor.Label>
            <Editor.Label className={style.switchLabel}>
              <Switch
                id='countToEnd'
                checked={countToEnd}
                onCheckedChange={(value) => handleSubmit('countToEnd', value)}
              />
              {countToEnd ? 'On' : 'Off'}
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
            <Select
              value={timerType}
              onValueChange={(value: TimerType | null) => {
                if (value === null) return;
                handleSubmit('timerType', value);
              }}
              options={[
                { value: TimerType.CountDown, label: 'Count down' },
                { value: TimerType.CountUp, label: 'Count up' },
                { value: TimerType.Clock, label: 'Clock' },
                { value: TimerType.None, label: 'None' },
              ]}
            />
          </div>

          <div className={style.inline}>
            <div>
              <Editor.Label htmlFor='timeWarning'>Warning Time</Editor.Label>
              <TimeInput
                id='timeWarning'
                name='timeWarning'
                submitHandler={handleSubmit}
                time={timeWarning}
                placeholder='Duration'
              />
            </div>
            <div>
              <Editor.Label htmlFor='timeDanger'>Danger Time</Editor.Label>
              <TimeInput
                id='timeDanger'
                name='timeDanger'
                submitHandler={handleSubmit}
                time={timeDanger}
                placeholder='Duration'
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
