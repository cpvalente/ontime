import { memo } from 'react';
import { IoInformationCircle } from '@react-icons/all-files/io5/IoInformationCircle';
import { EndAction, MaybeString, TimerType, TimeStrategy } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { NativeSelectField, NativeSelectRoot } from '../../../../common/components/ui/native-select';
import { Switch } from '../../../../common/components/ui/switch';
import { Tooltip } from '../../../../common/components/ui/tooltip';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { millisToDelayString } from '../../../../common/utils/dateConfig';
import * as Editor from '../../../editors/editor-utils/EditorUtils';
import TimeInputFlow from '../../time-input-flow/TimeInputFlow';

import style from '../EventEditor.module.scss';

interface EventEditorTimesProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: MaybeString;
  countToEnd: boolean;
  delay: number;
  isPublic: boolean;
  endAction: EndAction;
  timerType: TimerType;
  timeWarning: number;
  timeDanger: number;
}

type HandledActions = 'countToEnd' | 'timerType' | 'endAction' | 'isPublic' | 'timeWarning' | 'timeDanger';

function EventEditorTimes(props: EventEditorTimesProps) {
  const {
    eventId,
    timeStart,
    timeEnd,
    duration,
    timeStrategy,
    linkStart,
    countToEnd,
    delay,
    isPublic,
    endAction,
    timerType,
    timeWarning,
    timeDanger,
  } = props;
  const { updateEvent } = useEventAction();

  const handleSubmit = (field: HandledActions, value: string | boolean) => {
    if (field === 'isPublic') {
      updateEvent({ id: eventId, isPublic: !(value as boolean) });
      return;
    }

    if (field === 'countToEnd') {
      updateEvent({ id: eventId, countToEnd: !(value as boolean) });
      return;
    }

    if (field === 'timeWarning' || field === 'timeDanger') {
      const newTime = parseUserTime(value as string);
      updateEvent({ id: eventId, [field]: newTime });
      return;
    }

    if (field === 'timerType' || field === 'endAction') {
      updateEvent({ id: eventId, [field]: value });
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
            <NativeSelectRoot size='sm'>
              <NativeSelectField
                name='endAction'
                id='endAction'
                value={endAction}
                onChange={(event) => handleSubmit('endAction', event.currentTarget.value)}
              >
                <option value={EndAction.None}>None</option>
                <option value={EndAction.Stop}>Stop rundown</option>
                <option value={EndAction.LoadNext}>Load next event</option>
                <option value={EndAction.PlayNext}>Play next event</option>
              </NativeSelectField>
            </NativeSelectRoot>
          </div>
          <div>
            <Editor.Label htmlFor='countToEnd'>Count to End</Editor.Label>
            <Editor.Label className={style.switchLabel}>
              <Switch
                id='countToEnd'
                size='md'
                checked={countToEnd}
                onChange={() => handleSubmit('countToEnd', countToEnd)}
              />
              {countToEnd ? 'On' : 'Off'}
            </Editor.Label>
          </div>
        </div>
      </div>

      <div className={style.column}>
        <Editor.Title>
          <Tooltip content='Changes how the timer is displayed in different views. It is not reflected in the rundown'>
            <span>
              Display Options
              <IoInformationCircle className={style.tooltipIcon} />
            </span>
          </Tooltip>
        </Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='timerType'>Timer Type</Editor.Label>
            <NativeSelectRoot size='sm'>
              <NativeSelectField
                id='timerType'
                name='timerType'
                value={timerType}
                onChange={(event) => handleSubmit('timerType', event.currentTarget.value)}
              >
                <option value={TimerType.CountDown}>Count down</option>
                <option value={TimerType.CountUp}>Count up</option>
                <option value={TimerType.Clock}>Clock</option>
                <option value={TimerType.None}>None</option>
              </NativeSelectField>
            </NativeSelectRoot>
          </div>
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
            <Editor.Label htmlFor='isPublic'>Event Visibility</Editor.Label>
            <Editor.Label className={style.switchLabel}>
              <Switch
                id='isPublic'
                size='md'
                checked={isPublic}
                onCheckedChange={() => handleSubmit('isPublic', isPublic)}
              />
              {isPublic ? 'Public' : 'Private'}
            </Editor.Label>
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
    </>
  );
}

export default memo(EventEditorTimes);
