import { memo } from 'react';
import { Select, Switch } from '@chakra-ui/react';
import { EndAction, MaybeString, TimerType, TimeStrategy } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { millisToDelayString } from '../../../../common/utils/dateConfig';
import { multipleValuesPlaceholder } from '../../../../common/utils/multiValueText';
import TimeInputFlow from '../../time-input-flow/TimeInputFlow';

import style from '../EventEditor.module.scss';
type HandledActions = 'timerType' | 'endAction' | 'isPublic' | 'timeWarning' | 'timeDanger';

interface EventEditorTimesCoreProps {
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
}

interface EventEditorTimesMultiProps extends Partial<EventEditorTimesCoreProps> {
  isMultiple: true;
  id: string[];
}

interface EventEditorTimesProps extends EventEditorTimesCoreProps {
  isMultiple?: false;
  id: string;
}

const EventEditorTimes = ({
  id,
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
  isMultiple,
}: EventEditorTimesProps | EventEditorTimesMultiProps) => {
  const { updateEvent, batchUpdateEvents } = useEventAction();

  const handleSubmit = (field: HandledActions, value: string | boolean) => {
    if (field === 'isPublic') {
      if (isMultiple) {
        batchUpdateEvents({ isPublic: !(value as boolean) }, id);
      } else {
        updateEvent({ id, isPublic: !(value as boolean) });
      }
      return;
    }

    if (field === 'timeWarning' || field === 'timeDanger') {
      const newTime = parseUserTime(value as string);
      if (isMultiple) {
        batchUpdateEvents({ [field]: newTime }, id);
      } else {
        updateEvent({ id, [field]: newTime });
      }
      return;
    }

    if (field === 'timerType' || field === 'endAction') {
      if (isMultiple) {
        batchUpdateEvents({ [field]: value }, id);
      } else {
        updateEvent({ id, [field]: value });
      }
      return;
    }
  };

  const hasDelay = delay !== 0;
  const delayLabel =
    !isMultiple && hasDelay
      ? `Event is ${millisToDelayString(delay, 'expanded')}. New schedule ${millisToString(
          timeStart + delay,
        )} → ${millisToString(timeEnd + delay)}`
      : '';

  return (
    <div className={style.column}>
      {!isMultiple ? (
        <div>
          <div className={style.inputLabel}>Event schedule</div>
          <div className={style.inline}>
            <TimeInputFlow
              eventId={id}
              timeStart={timeStart}
              timeEnd={timeEnd}
              duration={duration}
              timeStrategy={timeStrategy}
              linkStart={linkStart}
              delay={delay}
            />
          </div>
          <div className={style.delayLabel}>{delayLabel}</div>
        </div>
      ) : null}

      <div className={style.splitTwo}>
        <div>
          <label className={style.inputLabel} htmlFor='timeWarning'>
            Warning Time
          </label>
          <TimeInput name='timeWarning' submitHandler={handleSubmit} time={timeWarning} placeholder='Duration' />
        </div>
        <div>
          <label className={style.inputLabel}>Timer Type</label>
          <Select
            size='sm'
            name='timerType'
            value={timerType}
            onChange={(event) => handleSubmit('timerType', event.target.value)}
            variant='ontime'
          >
            <option value={TimerType.CountDown}>Count down</option>
            <option value={TimerType.CountUp}>Count up</option>
            <option value={TimerType.TimeToEnd}>Time to end</option>
            <option value={TimerType.Clock}>Clock</option>
          </Select>
        </div>
        <div>
          <label className={style.inputLabel} htmlFor='timeDanger'>
            Danger Time
          </label>
          <TimeInput name='timeDanger' submitHandler={handleSubmit} time={timeDanger} placeholder='Duration' />
        </div>
        <div>
          <label className={style.inputLabel}>End Action</label>
          <Select
            size='sm'
            name='endAction'
            value={endAction}
            onChange={(event) => handleSubmit('endAction', event.target.value)}
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
            onChange={() => handleSubmit('isPublic', isPublic ?? false)}
            variant='ontime'
          />
          {isMultiple && isPublic === undefined ? multipleValuesPlaceholder : isPublic ? 'Public' : 'Private'}
        </label>
      </div>
    </div>
  );
};

export default memo(EventEditorTimes);
