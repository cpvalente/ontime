import { useCallback, useEffect, useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Editable, EditableInput, EditablePreview, Tooltip } from '@chakra-ui/react';
import { FiUsers } from '@react-icons/all-files/fi/FiUsers';
import { IoOptions } from '@react-icons/all-files/io5/IoOptions';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoPlayBackOutline } from '@react-icons/all-files/io5/IoPlayBackOutline';
import { IoPlayOutline } from '@react-icons/all-files/io5/IoPlayOutline';
import { IoReload } from '@react-icons/all-files/io5/IoReload';
import { IoRemoveCircle } from '@react-icons/all-files/io5/IoRemoveCircle';
import { IoRemoveCircleOutline } from '@react-icons/all-files/io5/IoRemoveCircleOutline';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import { IoReturnDownForward } from '@react-icons/all-files/io5/IoReturnDownForward';
import { IoTimerOutline } from '@react-icons/all-files/io5/IoTimerOutline';
import { editorEventId } from 'common/atoms/LocalEventSettings';
import TooltipActionBtn from 'common/components/buttons/TooltipActionBtn';
import { getAccessibleColour } from 'common/utils/styleUtils';
import { useAtom } from 'jotai';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { useEventProvider } from '../../../common/hooks/useSocketProvider';
import { Playstate } from '../../../common/models/OntimeTypes';
import { tooltipDelayMid } from '../../../ontimeConfig';
import { EventItemActions } from '../RundownEntry';

import EventBlockActionMenu from './composite/EventBlockActionMenu';
import EventBlockProgressBar from './composite/EventBlockProgressBar';
import EventBlockTimers from './composite/EventBlockTimers';

import style from './EventBlock.module.scss';

const blockBtnStyle = {
  size: 'sm',
  colorScheme: 'white',
  variant: 'ghost',
  fontSize: '20px',
};

const tooltipProps = {
  openDelay: tooltipDelayMid,
};

interface EventBlockProps {
  timeStart: number;
  timeEnd: number;
  duration: number;
  index: number;
  eventIndex: number;
  eventId: string;
  isPublic: boolean;
  title: string;
  note: string;
  delay: number;
  previousEnd: number;
  colour: string;
  next: boolean;
  skip: boolean;
  selected: boolean;
  playback?: Playstate;
  actionHandler: (action: EventItemActions, payload: any) => void;
}

export default function EventBlock(props: EventBlockProps) {
  const {
    timeStart,
    timeEnd,
    duration,
    index,
    eventIndex,
    eventId,
    isPublic = true,
    title,
    note,
    delay,
    previousEnd,
    colour,
    next,
    skip = false,
    selected,
    playback,
    actionHandler,
  } = props;

  const [openId, setOpenId] = useAtom(editorEventId);
  const { setPlayback } = useEventProvider(eventId);
  const { updateEvent } = useEventAction();
  const [blockTitle, setBlockTitle] = useState<string>(title || '');

  const binderColours = colour && getAccessibleColour(colour);
  const hasDelay = delay !== 0 && delay !== null;

  // Todo: could I re-render the item without causing a state change here?
  useEffect(() => {
    setBlockTitle(title);
  }, [title]);

  const handleTitle = useCallback(
    (text: string) => {
      if (text === title) {
        return;
      }

      const cleanVal = text.trim();
      setBlockTitle(cleanVal);

      updateEvent({ id: eventId, title: cleanVal });
    },
    [updateEvent, title],
  );

  const eventIsPlaying = selected && playback === 'start';
  const playBtnStyles = { _hover: {} };
  if (!skip && eventIsPlaying) {
    playBtnStyles._hover = { bg: '#c05621' };
  } else if (!skip && !eventIsPlaying) {
    playBtnStyles._hover = {};
  }

  return (
    <Draggable key={eventId} draggableId={eventId} index={index}>
      {(provided) => (
        <div
          className={`${style.eventBlock} ${skip ? style.skip : ''} ${
            selected ? style.selected : ''
          }`}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <div
            className={style.binder}
            style={{ ...binderColours }}
            tabIndex={-1}
            onClick={() => actionHandler('set-cursor', index)}
          >
            <span className={style.drag} {...provided.dragHandleProps}>
              <IoReorderTwo />
            </span>
            {eventIndex}
          </div>
          <div className={style.playbackActions}>
            <TooltipActionBtn
              aria-label='Skip event'
              tooltip='Skip event'
              openDelay={tooltipDelayMid}
              icon={skip ? <IoRemoveCircle /> : <IoRemoveCircleOutline />}
              {...blockBtnStyle}
              variant={skip ? 'solid' : 'ghost'}
              clickHandler={() => actionHandler('update', { field: 'skip', value: !skip })}
              tabIndex={-1}
              disabled={selected}
            />
            <TooltipActionBtn
              aria-label='Load event'
              tooltip='Load event'
              openDelay={tooltipDelayMid}
              icon={selected ? <IoPlayBackOutline /> : <IoReload />}
              disabled={skip}
              {...blockBtnStyle}
              clickHandler={() => setPlayback.loadEvent(eventId)}
              tabIndex={-1}
            />
            <TooltipActionBtn
              aria-label='Start event'
              tooltip='Start event'
              openDelay={tooltipDelayMid}
              icon={eventIsPlaying ? <IoPlay /> : <IoPlayOutline />}
              disabled={skip}
              {...blockBtnStyle}
              variant={eventIsPlaying ? 'solid' : 'ghost'}
              clickHandler={() => setPlayback.startEvent(eventId)}
              backgroundColor={eventIsPlaying ? '#58A151' : undefined}
              tabIndex={-1}
            />
          </div>
          <EventBlockTimers
            timeStart={timeStart}
            timeEnd={timeEnd}
            duration={duration}
            delay={delay}
            actionHandler={actionHandler}
            previousEnd={previousEnd}
          />
          <Editable
            value={blockTitle}
            className={`${style.eventTitle} ${!title || title === '' ? style.noTitle : ''}`}
            placeholder='Event title'
            onChange={(value) => setBlockTitle(value)}
            onSubmit={(value) => handleTitle(value)}
          >
            <EditablePreview className={style.eventTitle__preview} />
            <EditableInput />
          </Editable>
          <div className={style.statusElements}>
            <span className={style.eventNote}>{note}</span>
            <div className={selected ? style.progressBg : `${style.progressBg} ${style.hidden}`}>
              <EventBlockProgressBar playback={playback} />
            </div>
            <div className={style.eventStatus}>
              <Tooltip label='Next event' isDisabled={!next} {...tooltipProps}>
              <span
                className={`${style.statusIcon} ${style.statusNext} ${next ? style.enabled : ''}`}
              >
                <IoReturnDownForward />
              </span>
              </Tooltip>
              <Tooltip label='Event has delay' isDisabled={!hasDelay} {...tooltipProps}>
              <span
                className={`${style.statusIcon} ${style.statusDelay} ${
                  hasDelay ? style.enabled : ''
                }`}
              >
                <IoTimerOutline />
              </span>
              </Tooltip>
              <Tooltip
                label={`${isPublic ? 'Event is public' : 'Event is private'}`}
                {...tooltipProps}
              >
              <span
                className={`${style.statusIcon} ${style.statusPublic} ${
                  isPublic ? style.enabled : ''
                }`}
              >
                <FiUsers />
              </span>
              </Tooltip>
            </div>
          </div>
          <div className={style.eventActions}>
            <TooltipActionBtn
              {...blockBtnStyle}
              size='sm'
              icon={<IoOptions />}
              clickHandler={() => setOpenId((prev) => prev === eventId ? null : eventId)}
              tooltip='Event options'
              aria-label='Event options'
              tabIndex={-1}
              backgroundColor={openId === eventId ? '#ebedf0' : 'transparent'}
              color={openId === eventId ? '#333' : '#ebedf0'}
              _hover={{ bg: '#ebedf0', color: '#333' }}
            />
            <EventBlockActionMenu
              showAdd
              showDelay
              showBlock
              showClone
              actionHandler={actionHandler}
            />
          </div>
        </div>
      )}
    </Draggable>
  );
}
