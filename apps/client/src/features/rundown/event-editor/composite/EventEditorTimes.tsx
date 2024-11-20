import { memo } from 'react';
import { Select, Switch } from '@chakra-ui/react';
import { EndAction, MaybeString, TimerType, TimeStrategy } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { millisToDelayString } from '../../../../common/utils/dateConfig';
import TimeInputFlow from '../../time-input-flow/TimeInputFlow';
import { type EditorSubmitHandler } from '../EventEditor';

import style from '../EventEditor.module.scss';

interface EventEditorTimesProps {
  isMulti?: boolean;
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: MaybeString;
  delay: number;
  isPublic: boolean;
  endAction: EndAction;
  timerType: TimerType;
  timeWarning: number;
  timeDanger: number;
  handleSubmit: EditorSubmitHandler;
}

type HandledActions =
  | 'timerType'
  | 'endAction'
  | 'isPublic'
  | 'timeWarning'
  | 'timeDanger'
  | 'timeStart'
  | 'timeEnd'
  | 'duration'
  | 'timeStrategy'
  | 'linkStart';

const EventEditorTimes = (props: EventEditorTimesProps) => {
  const {
    timeStart,
    timeEnd,
    duration,
    timeStrategy,
    linkStart,
    delay,
    isPublic,
    endAction,
    timerType,
    timeWarning,
    timeDanger,
    handleSubmit,
  } = props;

  const handleSubmitWrapper = (field: HandledActions, value: string | boolean | null) => {
    if (field === 'isPublic') {
      handleSubmit({ isPublic: !(value as boolean) });
      return;
    }

    if (
      field === 'timeWarning' ||
      field === 'timeDanger' ||
      field === 'timeStart' ||
      field === 'timeEnd' ||
      field === 'duration'
    ) {
      //FIXME: loss of th  `p` and `+`  smart entry
      const newTime = parseUserTime(value as string);
      handleSubmit({ [field]: newTime });
      return;
    }

    if (field === 'timerType' || field === 'endAction' || field === 'timeStrategy' || field === 'linkStart') {
      handleSubmit({ [field]: value });
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
    <div className={style.column}>
      <div>
        <div className={style.inputLabel}>Event schedule</div>
        <div className={style.inline}>
          <TimeInputFlow
            timeStart={timeStart}
            timeEnd={timeEnd}
            duration={duration}
            timeStrategy={timeStrategy}
            linkStart={linkStart}
            delay={delay}
            timerType={timerType}
            handleSubmit={handleSubmitWrapper}
          />
        </div>
        <div className={style.delayLabel}>{delayLabel}</div>
      </div>

      <div className={style.splitTwo}>
        <div>
          <label className={style.inputLabel} htmlFor='timeWarning'>
            Warning Time
          </label>
          <TimeInput name='timeWarning' submitHandler={handleSubmitWrapper} time={timeWarning} placeholder='Duration' />
        </div>
        <div>
          <label className={style.inputLabel}>Timer Type</label>
          <Select
            size='sm'
            name='timerType'
            value={timerType}
            onChange={(event) => handleSubmitWrapper('timerType', event.target.value)}
            variant='ontime'
          >
            <option value={TimerType.CountDown}>Count down</option>
            <option value={TimerType.CountUp}>Count up</option>
            <option value={TimerType.TimeToEnd}>Time to end</option>
            <option value={TimerType.Clock}>Clock</option>
            <option value={TimerType.None}>None</option>
          </Select>
        </div>
        <div>
          <label className={style.inputLabel} htmlFor='timeDanger'>
            Danger Time
          </label>
          <TimeInput name='timeDanger' submitHandler={handleSubmitWrapper} time={timeDanger} placeholder='Duration' />
        </div>
        <div>
          <label className={style.inputLabel}>End Action</label>
          <Select
            size='sm'
            name='endAction'
            value={endAction}
            onChange={(event) => handleSubmitWrapper('endAction', event.target.value)}
            variant='ontime'
          >
            <option value={EndAction.None}>None</option>
            <option value={EndAction.Stop}>Stop</option>
            <option value={EndAction.LoadNext}>Load Next</option>
            <option value={EndAction.PlayNext}>Play Next</option>
          </Select>
        </div>
      </div>

      <div>
        <span className={style.inputLabel}>Event Visibility</span>
        <label className={style.switchLabel}>
          <Switch
            size='md'
            isChecked={isPublic}
            onChange={() => handleSubmitWrapper('isPublic', isPublic)}
            variant='ontime'
          />
          {isPublic ? 'Public' : 'Private'}
        </label>
      </div>
    </div>
  );
};

export default memo(EventEditorTimes);
