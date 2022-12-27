import { useCallback, useEffect, useRef, useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Editable, EditableInput, EditablePreview, Tooltip } from '@chakra-ui/react';
import { IoOptions } from '@react-icons/all-files/io5/IoOptions';
import { IoPeople } from '@react-icons/all-files/io5/IoPeople';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoPlayOutline } from '@react-icons/all-files/io5/IoPlayOutline';
import { IoPlaySkipForward } from '@react-icons/all-files/io5/IoPlaySkipForward';
import { IoReload } from '@react-icons/all-files/io5/IoReload';
import { IoRemoveCircle } from '@react-icons/all-files/io5/IoRemoveCircle';
import { IoRemoveCircleOutline } from '@react-icons/all-files/io5/IoRemoveCircleOutline';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import { editorEventId } from 'common/atoms/LocalEventSettings';
import TooltipActionBtn from 'common/components/buttons/TooltipActionBtn';
import { cx, getAccessibleColour } from 'common/utils/styleUtils';
import { useAtom } from 'jotai';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { setEventPlayback } from '../../../common/hooks/useSocket';
import { Playback } from '../../../common/models/OntimeTypes';
import { tooltipDelayMid } from '../../../ontimeConfig';
import { EventItemActions } from '../RundownEntry';

import BlockActionMenu from './composite/BlockActionMenu';
import EventBlockProgressBar from './composite/EventBlockProgressBar';
import EventBlockTimers from './composite/EventBlockTimers';

import style from './EventBlock.module.scss';

const blockBtnStyle = {
  size: 'sm',
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
  hasCursor: boolean;
  playback?: Playback;
  actionHandler: (action: EventItemActions, payload?: any) => void;
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
    hasCursor,
    playback,
    actionHandler,
  } = props;

  const [openId, setOpenId] = useAtom(editorEventId);
  const { updateEvent } = useEventAction();
  const [blockTitle, setBlockTitle] = useState<string>(title || '');
  const onFocusRef = useRef<null | HTMLSpanElement>(null);

  const binderColours = colour && getAccessibleColour(colour);

  // Todo: could I re-render the item without causing a state change here?
  // ?? use refs instead?
  useEffect(() => {
    setBlockTitle(title);
  }, [title]);

  useEffect(() => {
    if (hasCursor) {
      onFocusRef?.current?.focus();
    }
  }, [hasCursor]);

  const handleTitle = useCallback(
    (text: string) => {
      if (text === title) {
        return;
      }

      const cleanVal = text.trim();
      setBlockTitle(cleanVal);

      updateEvent({ id: eventId, title: cleanVal });
    },
    [title, updateEvent, eventId],
  );

  const eventIsPlaying = selected && playback === 'play';
  const playBtnStyles = { _hover: {} };
  if (!skip && eventIsPlaying) {
    playBtnStyles._hover = { bg: '#c05621' };
  } else if (!skip && !eventIsPlaying) {
    playBtnStyles._hover = {};
  }

  const blockClasses = cx([
    style.eventBlock,
    skip ? style.skip : null,
    selected ? style.selected : null,
    hasCursor ? style.hasCursor : null,
  ]);

  return (
    <Draggable key={eventId} draggableId={eventId} index={index}>
      {(provided) => (
        <div
          className={blockClasses}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <div
            className={style.binder}
            style={{ ...binderColours }}
            tabIndex={-1}
            onClick={() => actionHandler('set-cursor', index)}
          >
            <span className={style.drag} {...provided.dragHandleProps} ref={onFocusRef}>
              <IoReorderTwo />
            </span>
            {eventIndex}
          </div>
          <div className={style.playbackActions}>
            <TooltipActionBtn
              variant='ontime-subtle-white'
              aria-label='Skip event'
              tooltip='Skip event'
              icon={skip ? <IoRemoveCircle /> : <IoRemoveCircleOutline />}
              {...tooltipProps}
              {...blockBtnStyle}
              clickHandler={() => actionHandler('update', { field: 'skip', value: !skip })}
              tabIndex={-1}
              disabled={selected}
            />
            <TooltipActionBtn
              variant='ontime-subtle-white'
              aria-label='Load event'
              tooltip='Load event'
              icon={<IoReload className={style.flip} />}
              disabled={skip}
              {...tooltipProps}
              {...blockBtnStyle}
              clickHandler={() => setEventPlayback.loadEvent(eventId)}
              tabIndex={-1}
            />
            <TooltipActionBtn
              variant='ontime-subtle-white'
              aria-label='Start event'
              tooltip='Start event'
              icon={eventIsPlaying ? <IoPlay /> : <IoPlayOutline />}
              disabled={skip}
              {...tooltipProps}
              {...blockBtnStyle}
              clickHandler={() => setEventPlayback.startEvent(eventId)}
              backgroundColor={eventIsPlaying ? '#58A151' : undefined}
              _hover={{ backgroundColor: eventIsPlaying ? '#58A151' : undefined }}
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
            variant='ontime'
            value={blockTitle}
            className={`${style.eventTitle} ${!title ? style.noTitle : ''}`}
            placeholder='Event title'
            onChange={(value) => setBlockTitle(value)}
            onSubmit={(value) => handleTitle(value)}
          >
            <EditablePreview className={style.preview} />
            <EditableInput />
          </Editable>
          <div className={style.statusElements}>
            <span className={style.eventNote}>{note}</span>
            <div className={selected ? style.progressBg : `${style.progressBg} ${style.hidden}`}>
              <EventBlockProgressBar playback={playback} />
            </div>
            <div className={style.eventStatus} tabIndex={-1}
            >
              <Tooltip
                label='Next event'
                isDisabled={!next}
                {...tooltipProps}
              >
                <span>
                  <IoPlaySkipForward
                    className={`${style.statusIcon} ${next ? style.active : ''}`} />
                </span>
              </Tooltip>
              <Tooltip
                label={`${isPublic ? 'Event is public' : 'Event is private'}`}
                {...tooltipProps}
              >
                <span>
                  <IoPeople className={`${style.statusIcon} ${isPublic ? style.active : ''}`} />
                </span>
              </Tooltip>
            </div>
          </div>
          <div className={style.eventActions}>
            <TooltipActionBtn
              {...blockBtnStyle}
              variant='ontime-subtle-white'
              size='sm'
              icon={<IoOptions />}
              clickHandler={() => setOpenId((prev) => prev === eventId ? null : eventId)}
              tooltip='Event options'
              aria-label='Event options'
              tabIndex={-1}
              backgroundColor={openId === eventId ? '#2B5ABC' : undefined}
              color={openId === eventId ? 'white' : '#f6f6f6'}
            />
            <BlockActionMenu
              showAdd
              showDelay
              showBlock
              showClone
              enableDelete={!selected}
              actionHandler={actionHandler}
            />
          </div>
        </div>
      )}
    </Draggable>
  );
}
