import { memo } from 'react';
import { IoInformationCircle } from 'react-icons/io5';
import { Select, Switch, Tooltip } from '@chakra-ui/react';
import { EndAction, TimerType, TimeStrategy } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { useEntryActions } from '../../../../common/hooks/useEntryAction';
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
  linkStart: boolean;
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
  const { updateEntry } = useEntryActions();

  const handleSubmit = (field: HandledActions, value: string | boolean) => {
    if (field === 'isPublic') {
      updateEntry({ id: eventId, isPublic: !(value as boolean) });
      return;
    }

    if (field === 'countToEnd') {
      updateEntry({ id: eventId, countToEnd: !(value as boolean) });
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
              id='endAction'
              size='sm'
              name='endAction'
              value={endAction}
              onChange={(event) => handleSubmit('endAction', event.target.value)}
              variant='ontime'
            >
              <option value={EndAction.None}>None</option>
              <option value={EndAction.LoadNext}>Load next event</option>
              <option value={EndAction.PlayNext}>Play next event</option>
            </Select>
          </div>
          <div>
            <Editor.Label htmlFor='countToEnd'>Count to End</Editor.Label>
            <Editor.Label className={style.switchLabel}>
              <Switch
                id='countToEnd'
                size='md'
                isChecked={countToEnd}
                onChange={() => handleSubmit('countToEnd', countToEnd)}
                variant='ontime'
              />
              {countToEnd ? 'On' : 'Off'}
            </Editor.Label>
          </div>
        </div>
      </div>

      <div className={style.column}>
        <Editor.Title>
          <Tooltip label='Changes how the timer is displayed in different views. It is not reflected in the rundown'>
            <span>
              Display Options
              <IoInformationCircle className={style.tooltipIcon} />
            </span>
          </Tooltip>
        </Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='timerType'>Timer Type</Editor.Label>
            <Select
              size='sm'
              id='timerType'
              name='timerType'
              value={timerType}
              onChange={(event) => handleSubmit('timerType', event.target.value)}
              variant='ontime'
            >
              <option value={TimerType.CountDown}>Count down</option>
              <option value={TimerType.CountUp}>Count up</option>
              <option value={TimerType.Clock}>Clock</option>
              <option value={TimerType.None}>None</option>
            </Select>
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
                isChecked={isPublic}
                onChange={() => handleSubmit('isPublic', isPublic)}
                variant='ontime'
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
