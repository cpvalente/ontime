import { useCallback, useContext, useEffect, useState } from 'react';
import { Button } from '@chakra-ui/react';
import { FiUsers } from '@react-icons/all-files/fi/FiUsers';
import { IoBan } from '@react-icons/all-files/io5/IoBan';
import { editorEventId } from 'common/atoms/LocalEventSettings';
import ColourInput from 'common/components/input/ColourInput';
import TextInput from 'common/components/input/TextInput';
import TimeInput from 'common/components/input/TimeInput';
import { LoggingContext } from 'common/context/LoggingContext';
import { useEventAction } from 'common/hooks/useEventAction';
import { millisToMinutes } from 'common/utils/dateConfig';
import getDelayTo from 'common/utils/getDelayTo';
import { stringFromMillis } from 'common/utils/time';
import { calculateDuration, validateEntry } from 'common/utils/timesManager';
import { useAtom } from 'jotai';

import useEventsList from '../../common/hooks-query/useEventsList';

import style from './EventEditor.module.scss';

export default function EventEditor() {
  const [openId] = useAtom(editorEventId);
  const { data } = useEventsList();
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
    return <span>Loading</span>;
  }

  const delayed = delay !== 0;
  const addedTime = delayed
    ? `${delay >= 0 ? '+' : '-'} ${millisToMinutes(Math.abs(delay))} minutes`
    : null;
  const newStart = delayed ? `New start ${stringFromMillis(event.timeStart + delay)}` : null;
  const newEnd = delayed ? `New end ${stringFromMillis(event.timeEnd + delay)}` : null;

  return (
    <div className={style.eventEditor}>
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
          delay={0}
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
          delay={0}
          placeholder='End'
        />
        <label className={style.inputLabel}>Duration</label>
        <TimeInput
          name='duration'
          submitHandler={handleSubmit}
          validationHandler={timerValidationHandler}
          time={event.duration}
          delay={0}
          placeholder='Duration'
        />
      </div>
      <div className={style.titles}>
        <div className={style.left}>
          <div className={style.column}>
            <label className={style.inputLabel}>Title</label>
            <TextInput field='title' initialText={event.title} submitHandler={handleSubmit} />
          </div>
          <div className={style.column}>
            <label className={style.inputLabel}>Subtitle</label>
            <TextInput field='subtitle' initialText={event.subtitle} submitHandler={handleSubmit} />
          </div>
          <div className={style.column}>
            <label className={style.inputLabel}>Presenter</label>
            <TextInput
              field='presenter'
              initialText={event.presenter}
              submitHandler={handleSubmit}
            />
          </div>
          <div className={style.padTop}>
            <Button
              leftIcon={<FiUsers />}
              size='sm'
              colorScheme='blue'
              variant={event.isPublic ? 'solid' : 'ghost'}
              onClick={() => togglePublic(event.isPublic)}
            >
              {event.isPublic ? 'Event is Public' : 'Make event public'}
            </Button>
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
                leftIcon={<IoBan />}
                onClick={() => handleSubmit('colour', '')}
                variant='ghost'
                colorScheme='blue'
                borderRadius='3px'
                size='sm'
              >
                Clear colour
              </Button>
            </div>
          </div>
          <div className={style.column}>
            <label className={style.inputLabel}>Notes</label>
            <TextInput
              field='note'
              initialText={event.note}
              submitHandler={handleSubmit}
              isTextArea
            />
          </div>
        </div>
        <div className={style.osc}>{`OSC Trigger /ontime/gotoid/${event.id}`}</div>
      </div>
    </div>
  );
}
