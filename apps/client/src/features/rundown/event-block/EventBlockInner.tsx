import { memo, MouseEvent, useCallback, useEffect, useState } from 'react';
import { Tooltip } from '@chakra-ui/react';
import { BiArrowToBottom } from '@react-icons/all-files/bi/BiArrowToBottom';
import { IoArrowDown } from '@react-icons/all-files/io5/IoArrowDown';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoOptions } from '@react-icons/all-files/io5/IoOptions';
import { IoPeople } from '@react-icons/all-files/io5/IoPeople';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoPlayForward } from '@react-icons/all-files/io5/IoPlayForward';
import { IoPlaySkipForward } from '@react-icons/all-files/io5/IoPlaySkipForward';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { IoTime } from '@react-icons/all-files/io5/IoTime';
import { EndAction, Playback, TimerType } from 'ontime-types';

import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import { tooltipDelayMid } from '../../../ontimeConfig';
import EditableBlockTitle from '../common/EditableBlockTitle';
import { EventItemActions } from '../RundownEntry';
import { useEventSelection } from '../useEventSelection';

import BlockActionMenu from './composite/BlockActionMenu';
import EventBlockPlayback from './composite/EventBlockPlayback';
import EventBlockProgressBar from './composite/EventBlockProgressBar';
import EventBlockTimers from './composite/EventBlockTimers';

import style from './EventBlock.module.scss';

const blockBtnStyle = {
  size: 'sm',
};

const tooltipProps = {
  openDelay: tooltipDelayMid,
};

interface EventBlockInnerProps {
  timeStart: number;
  timeEnd: number;
  duration: number;
  eventId: string;
  eventIndex: number;
  isPublic: boolean;
  endAction: EndAction;
  timerType: TimerType;
  title: string;
  note: string;
  delay: number;
  next: boolean;
  skip: boolean;
  selected: boolean;
  playback?: Playback;
  isRolling: boolean;
  actionHandler: (action: EventItemActions, payload?: any) => void;
  disableEdit: boolean;
}

const EventBlockInner = (props: EventBlockInnerProps) => {
  const {
    timeStart,
    timeEnd,
    duration,
    eventId,
    isPublic = true,
    endAction,
    timerType,
    title,
    note,
    delay,
    next,
    skip = false,
    selected,
    playback,
    isRolling,
    actionHandler,
    disableEdit,
  } = props;

  const [renderInner, setRenderInner] = useState(false);
  const { clearSelectedEvents, selectedEvents } = useEventSelection();

  const isOpen = selectedEvents.size === 1 && selectedEvents.has(eventId);

  useEffect(() => {
    setRenderInner(true);
  }, []);

  //TODO: fix this
  const toggleOpenEvent = useCallback(
    (_event: MouseEvent) => {
      // if (isOpen) {
      //   event.stopPropagation();
      //   clearSelectedEvents();
      // }
    },
    [clearSelectedEvents, isOpen],
  );

  const eventIsPlaying = playback === Playback.Play;
  const eventIsPaused = playback === Playback.Pause;

  const playBtnStyles = { _hover: {} };
  if (!skip && eventIsPlaying) {
    playBtnStyles._hover = { bg: '#c05621' }; // $ontime-paused
  } else if (!skip && !eventIsPlaying) {
    playBtnStyles._hover = {};
  }

  return !renderInner ? null : (
    <>
      <EventBlockTimers eventId={eventId} timeStart={timeStart} timeEnd={timeEnd} duration={duration} delay={delay} />
      <EditableBlockTitle title={title} eventId={eventId} placeholder='Event title' className={style.eventTitle} />
      {next && (
        <Tooltip label='Next event' {...tooltipProps}>
          <span className={style.nextTag}>UP NEXT</span>
        </Tooltip>
      )}
      <EventBlockPlayback
        eventId={eventId}
        skip={skip}
        isPlaying={eventIsPlaying}
        isPaused={eventIsPaused}
        selected={selected}
        disablePlayback={skip || isRolling}
      />
      <div className={style.statusElements}>
        <span className={style.eventNote}>{note}</span>
        <div className={selected ? style.progressBg : `${style.progressBg} ${style.hidden}`}>
          {selected && <EventBlockProgressBar playback={playback} />}
        </div>
        <div className={style.eventStatus} tabIndex={-1}>
          <Tooltip label={`Time type: ${timerType}`} {...tooltipProps}>
            <span>
              <TimerIcon type={timerType} className={style.statusIcon} />
            </span>
          </Tooltip>
          <Tooltip label={`End action: ${endAction}`} {...tooltipProps}>
            <span>
              <EndActionIcon action={endAction} className={style.statusIcon} />
            </span>
          </Tooltip>
          <Tooltip label={`${isPublic ? 'Event is public' : 'Event is private'}`} {...tooltipProps}>
            <span>
              <IoPeople
                className={`${style.statusIcon} ${isPublic ? style.active : style.disabled}`}
                data-ispublic={isPublic}
              />
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
          clickHandler={toggleOpenEvent}
          tooltip='Event options'
          aria-label='Event options'
          tabIndex={-1}
          backgroundColor={isOpen ? '#2B5ABC' : undefined}
          color={isOpen ? 'white' : '#f6f6f6'}
          isDisabled={disableEdit}
        />
        <BlockActionMenu showClone enableDelete={!selected} actionHandler={actionHandler} />
      </div>
    </>
  );
};

export default memo(EventBlockInner);

function EndActionIcon(props: { action: EndAction; className: string }) {
  const { action, className } = props;
  if (action === EndAction.LoadNext) {
    return <IoPlaySkipForward className={className} />;
  }
  if (action === EndAction.PlayNext) {
    return <IoPlayForward className={className} />;
  }
  if (action === EndAction.Stop) {
    return <IoStop className={className} />;
  }
  return <IoPlay className={className} />;
}

function TimerIcon(props: { type: TimerType; className: string }) {
  const { type, className } = props;
  if (type === TimerType.CountUp) {
    return <IoArrowUp className={className} />;
  }
  if (type === TimerType.Clock) {
    return <IoTime className={className} />;
  }
  if (type === TimerType.TimeToEnd) {
    return <BiArrowToBottom className={className} />;
  }
  return <IoArrowDown className={className} />;
}
