import { useCallback, useContext, useEffect, useState } from 'react';
import { Button, Select, Switch } from '@chakra-ui/react';
import { IoBan } from '@react-icons/all-files/io5/IoBan';
import { editorEventId } from 'common/atoms/LocalEventSettings';
import ColourInput from 'common/components/input/colour-input/ColourInput';
import TextInput from 'common/components/input/text-input/TextInput';
import TimeInput from 'common/components/input/time-input/TimeInput';
import { LoggingContext } from 'common/context/LoggingContext';
import { useEventAction } from 'common/hooks/useEventAction';
import { millisToMinutes } from 'common/utils/dateConfig';
import getDelayTo from 'common/utils/getDelayTo';
import { stringFromMillis } from 'common/utils/time';
import { calculateDuration, validateEntry } from 'common/utils/timesManager';
import { useAtom } from 'jotai';

import CopyTag from '../../common/components/copy-tag/CopyTag';
import useRundown from '../../common/hooks-query/useRundown';

import style from './EventEditor.module.scss';

export default function EventEditor() {
  const [openId] = useAtom(editorEventId);
  const { data } = useRundown();
  const { emitWarning, emitError } = useContext(LoggingContext);
  const { updateEvent } = useEventAction();
  const [event, setEvent] = useState(null);
  const [delay, setDelay] = useState(0);

  useEffect(() => {
    if (!data || !openId) {
      return;
    }

    const eventIndex = data.findIndex((event) => event.id === openId);
    if (eventIndex > -1) {
      setDelay(getDelayTo(data, eventIndex));
      setEvent(data[eventIndex]);
    }
  }, [data, event, openId]);

  const handleSubmit = useCallback(
    (field, value) => {
      const newEventData = { id: event.id };
      switch (field) {
        case 'durationOverride': {
          // duration defines timeEnd
          newEventData.timeEnd = event.timeStart += value;
          break;
        }
        case 'timeStart': {
          newEventData.duration = calculateDuration(value, event.timeEnd);
          newEventData.timeStart = value;
          break;
        }
        case 'timeEnd': {
          newEventData.duration = calculateDuration(event.timeStart, value);
          newEventData.timeEnd = value;
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
    (entry, val) => {
      const valid = validateEntry(entry, val, event.timeStart, event.timeEnd);
      if (!valid.value) {
        emitWarning(`Time Input Warning: ${valid.catch}`);
      }
      return valid.value;
    },
    [emitWarning, event?.timeStart, event?.timeEnd],
  );

  const togglePublic = useCallback(
    (currentValue) => {
      updateEvent({ id: event.id, isPublic: !currentValue });
    },
    [event?.id, updateEvent],
  );

  if (!event) {
    return <span>Loading...</span>;
  }

  const delayed = delay !== 0;
  const addedTime = delayed
    ? `${delay >= 0 ? '+' : '-'} ${millisToMinutes(Math.abs(delay))} minutes`
    : null;
  const newStart = delayed ? `New start ${stringFromMillis(event.timeStart + delay)}` : null;
  const newEnd = delayed ? `New end ${stringFromMillis(event.timeEnd + delay)}` : null;

  return (
    <div className={style.eventEditor}>
      <div className={style.eventInfo}>{`Event ${'not yet'} | Event ID ${event.id}`}</div>
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
          />
          <label className={style.inputLabel}>Duration</label>
          <TimeInput
            name='duration'
            submitHandler={handleSubmit}
            validationHandler={timerValidationHandler}
            time={event.duration}
            delay={delay}
            placeholder='Duration'
          />
        </div>
        <div className={style.timeSettings}>
          <label className={style.inputLabel}>Timer type</label>
          <Select size='sm' variant='ontime'>
            <option value='option1'>Start to end</option>
            <option value='option2'>Duration</option>
            <option value='option3'>Follow previous</option>
            <option value='option3'>Start only</option>
          </Select>
          <label className={style.inputLabel}>Countdown style</label>
          <Select size='sm' variant='ontime'>
            <option value='option1'>Count down</option>
            <option value='option2'>Count up</option>
            <option value='option3'>Clock</option>
          </Select>
          <span className={style.spacer} />
          <label className={`${style.inputLabel} ${style.publicToggle}`}>
            <Switch
              isChecked={event.isPublic}
              onChange={() => togglePublic(event.isPublic)}
              variant='ontime'
            />
            Event is public
          </label>
        </div>
      </div>
      <div className={style.titles}>
        <div className={style.left}>
          <div className={style.column}>
            <label className={style.inputLabel}>Title</label>
            <TextInput field='title' initialText={event.title} submitHandler={handleSubmit} />
          </div>
          <div className={style.column}>
            <label className={style.inputLabel}>Presenter</label>
            <TextInput
              field='presenter'
              initialText={event.presenter}
              submitHandler={handleSubmit}
            />
          </div>
          <div className={style.column}>
            <label className={style.inputLabel}>Subtitle</label>
            <TextInput field='subtitle' initialText={event.subtitle} submitHandler={handleSubmit} />
          </div>
        </div>
        <div className={style.right}>
          <div className={style.column}>
            <label className={style.inputLabel}>Colour</label>
            <div className={style.inline}>
              <ColourInput
                value={event?.colour}
                handleChange={(value) => handleSubmit('colour', value)}
              />
              <Button
                rightIcon={<IoBan />}
                onClick={() => handleSubmit('colour', '')}
                variant='ontime-subtle'
                size='sm'
              >
                Clear colour
              </Button>
            </div>
          </div>
          <div className={`${style.column} ${style.fullHeight}`}>
            <label className={style.inputLabel}>Note</label>
            <TextInput
              field='note'
              initialText={event.note}
              submitHandler={handleSubmit}
              isTextArea
              isFullHeight
            />
          </div>
        </div>
      </div>
    </div>
  );
}
