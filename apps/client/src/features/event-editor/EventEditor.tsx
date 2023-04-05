import { useCallback, useEffect, useState } from 'react';
import { Select, Switch } from '@chakra-ui/react';
import { EndAction, OntimeEvent, TimerType } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import CopyTag from '../../common/components/copy-tag/CopyTag';
import SwatchSelect from '../../common/components/input/colour-input/SwatchSelect';
import TimeInput from '../../common/components/input/time-input/TimeInput';
import { useEventAction } from '../../common/hooks/useEventAction';
import useRundown from '../../common/hooks-query/useRundown';
import { useEventEditorStore } from '../../common/stores/eventEditor';
import { useEmitLog } from '../../common/stores/logger';
import { millisToMinutes } from '../../common/utils/dateConfig';
import getDelayTo from '../../common/utils/getDelayTo';
import { calculateDuration, TimeEntryField, validateEntry } from '../../common/utils/timesManager';

import CountedTextArea from './composite/CountedTextArea';
import CountedTextInput from './composite/CountedTextInput';

import style from './EventEditor.module.scss';

export type EventEditorSubmitActions = keyof OntimeEvent | 'durationOverride';

// Todo: add previous end to TimeInput fields
export default function EventEditor() {
  const { openId } = useEventEditorStore();
  const { data } = useRundown();
  const { emitError } = useEmitLog();
  const { updateEvent } = useEventAction();
  const [event, setEvent] = useState<OntimeEvent | null>(null);
  const [delay, setDelay] = useState(0);
  const [warning, setWarnings] = useState({ start: '', end: '', duration: '' });

  useEffect(() => {
    if (!data || !openId) {
      return;
    }

    const eventIndex = data.findIndex((event) => event.id === openId);
    if (eventIndex > -1) {
      const event = data[eventIndex];
      if (event.type === 'event') {
        setDelay(getDelayTo(data, eventIndex));
        setEvent(data[eventIndex] as OntimeEvent);
      }
    }
  }, [data, event, openId]);

  const handleSubmit = useCallback(
    (field: EventEditorSubmitActions, value: string | number) => {
      if (event === null) {
        return;
      }
      const newEventData: Partial<OntimeEvent> = { id: event.id };
      switch (field) {
        case 'durationOverride': {
          // duration defines timeEnd
          newEventData.duration = value as number;
          newEventData.timeEnd = event.timeStart + (value as number);
          break;
        }
        case 'timeStart': {
          newEventData.duration = calculateDuration(value as number, event.timeEnd);
          newEventData.timeStart = value as number;
          break;
        }
        case 'timeEnd': {
          newEventData.duration = calculateDuration(event.timeStart, value as number);
          newEventData.timeEnd = value as number;
          break;
        }
        default: {
          if (field in event) {
            // create object with new field
            newEventData[field] = value;
            break;
          } else {
            emitError(`Unknown field: ${field}`);
            return;
          }
        }
      }
      updateEvent(newEventData);
    },
    [emitError, event, updateEvent],
  );

  const timerValidationHandler = useCallback(
    (entry: TimeEntryField, val: number) => {
      if (!event?.timeStart) {
        return true;
      }
      const valid = validateEntry(entry, val, event.timeStart, event.timeEnd);
      setWarnings((prev) => ({ ...prev, ...valid.warnings }));
      return valid.value;
    },
    [event?.timeStart, event?.timeEnd],
  );

  const handleChange = useCallback(
    (field: string, value: string) => {
      updateEvent({ id: event.id, [field]: value });
    },
    [event, updateEvent],
  );

  const togglePublic = useCallback(
    (currentValue: boolean) => {
      if (!event) {
        return;
      }
      updateEvent({ id: event.id, isPublic: !currentValue });
    },
    [event, updateEvent],
  );

  if (!event) {
    return <span>Loading...</span>;
  }

  const delayed = delay !== 0;
  const addedTime = delayed ? `${delay >= 0 ? '+' : '-'} ${millisToMinutes(Math.abs(delay))} minutes` : null;
  const newStart = delayed ? `New start ${millisToString(event.timeStart + delay)}` : null;
  const newEnd = delayed ? `New end ${millisToString(event.timeEnd + delay)}` : null;

  return (
    <div className={style.eventEditor}>
      <div className={style.eventInfo}>
        Event ID
        <span className={style.eventId}>{event.id}</span>
      </div>
      <div className={style.eventActions}>
        <CopyTag label='OSC trigger'>{`/ontime/gotoid/${event.id}`}</CopyTag>
      </div>
      <div className={style.timeOptions}>
        <div className={style.timers}>
          <label className={style.inputLabel}>
            Start time {delayed && <span className={style.delayLabel}>{addedTime}</span>}
            {delayed && <div className={style.delayLabel}>{newStart}</div>}
          </label>
          <TimeInput
            name='timeStart'
            submitHandler={handleSubmit}
            validationHandler={timerValidationHandler}
            time={event.timeStart}
            delay={delay}
            placeholder='Start'
            warning={warning.start}
          />
          <label className={style.inputLabel}>
            End time {delayed && <span className={style.delayLabel}>{addedTime}</span>}
            {delayed && <div className={style.delayLabel}>{newEnd}</div>}
          </label>
          <TimeInput
            name='timeEnd'
            submitHandler={handleSubmit}
            validationHandler={timerValidationHandler}
            time={event.timeEnd}
            delay={delay}
            placeholder='End'
            warning={warning.end}
          />
          <label className={style.inputLabel}>Duration</label>
          <TimeInput
            name='durationOverride'
            submitHandler={handleSubmit}
            validationHandler={timerValidationHandler}
            time={event.duration}
            placeholder='Duration'
            warning={warning.duration}
          />
        </div>
        <div className={style.timeSettings}>
          <label className={style.inputLabel}>Timer Type</label>
          <Select
            size='sm'
            name='timerType'
            value={event.timerType}
            onChange={(event) => handleChange('timerType', event.target.value)}
            variant='ontime'
          >
            <option value={TimerType.CountDown}>Count down</option>
            <option value={TimerType.CountUp}>Count up</option>
            <option value={TimerType.Clock}>Clock</option>
          </Select>
          <label className={style.inputLabel}>End Action</label>
          <Select
            size='sm'
            name='endAction'
            value={event.endAction}
            onChange={(event) => handleChange('endAction', event.target.value)}
            variant='ontime'
          >
            <option value={EndAction.Continue}>Continue</option>
            <option value={EndAction.Stop}>Stop</option>
            <option value={EndAction.LoadNext}>Load Next</option>
            <option value={EndAction.PlayNext}>Play Next</option>
          </Select>
          <span className={style.spacer} />
          <label className={`${style.inputLabel} ${style.publicToggle}`}>
            <Switch isChecked={event.isPublic} onChange={() => togglePublic(event.isPublic)} variant='ontime' />
            Event is public
          </label>
        </div>
      </div>
      <div className={style.titles}>
        <div className={style.left}>
          <CountedTextInput field='title' label='Title' initialValue={event.title} submitHandler={handleSubmit} />
          <CountedTextInput
            field='presenter'
            label='Presenter'
            initialValue={event.presenter}
            submitHandler={handleSubmit}
          />
          <CountedTextInput
            field='subtitle'
            label='Subtitle'
            initialValue={event.subtitle}
            submitHandler={handleSubmit}
          />
        </div>
        <div className={style.right}>
          <div className={style.column}>
            <label className={style.inputLabel}>Colour</label>
            <div className={style.inline}>
              <SwatchSelect name='colour' value={event.colour} handleChange={handleSubmit} />
            </div>
          </div>
          <CountedTextArea field='note' label='Note' initialValue={event.note} submitHandler={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
