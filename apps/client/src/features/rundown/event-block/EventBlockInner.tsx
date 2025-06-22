import { memo, useEffect, useState } from 'react';
import {
  IoArrowDown,
  IoArrowUp,
  IoBan,
  IoFlag,
  IoFlash,
  IoPlay,
  IoPlayForward,
  IoPlaySkipForward,
  IoTime,
} from 'react-icons/io5';
import { Tooltip } from '@chakra-ui/react';
import { EndAction, Playback, TimerType, TimeStrategy } from 'ontime-types';

import { cx } from '../../../common/utils/styleUtils';
import { tooltipDelayMid } from '../../../ontimeConfig';
import EditableBlockTitle from '../common/EditableBlockTitle';
import TimeInputFlow from '../time-input-flow/TimeInputFlow';

import EventBlockChip from './composite/EventBlockChip';
import EventBlockPlayback from './composite/EventBlockPlayback';
import EventBlockProgressBar from './composite/EventBlockProgressBar';

import style from './EventBlock.module.scss';

interface EventBlockInnerProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: boolean;
  countToEnd: boolean;
  eventIndex: number;
  endAction: EndAction;
  timerType: TimerType;
  title: string;
  note: string;
  delay: number;
  isNext: boolean;
  skip: boolean;
  loaded: boolean;
  playback?: Playback;
  isRolling: boolean;
  dayOffset: number;
  isPast: boolean;
  totalGap: number;
  isLinkedToLoaded: boolean;
  hasTriggers: boolean;
}

function EventBlockInner(props: EventBlockInnerProps) {
  const {
    eventId,
    timeStart,
    timeEnd,
    duration,
    timeStrategy,
    linkStart,
    countToEnd,
    endAction,
    timerType,
    title,
    note,
    delay,
    isNext,
    skip = false,
    loaded,
    playback,
    isRolling,
    dayOffset,
    isPast,
    totalGap,
    isLinkedToLoaded,
    hasTriggers,
  } = props;

  const [renderInner, setRenderInner] = useState(false);

  useEffect(() => {
    setRenderInner(true);
  }, []);

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
      <div className={style.eventTimers}>
        <TimeInputFlow
          eventId={eventId}
          timeStart={timeStart}
          timeEnd={timeEnd}
          duration={duration}
          delay={delay}
          timeStrategy={timeStrategy}
          linkStart={linkStart}
          countToEnd={countToEnd}
        />
      </div>
      <div className={style.titleSection}>
        <EditableBlockTitle title={title} eventId={eventId} placeholder='Event title' className={style.eventTitle} />
        {isNext && <span className={style.nextTag}>UP NEXT</span>}
      </div>
      <EventBlockPlayback
        eventId={eventId}
        skip={skip}
        isPlaying={eventIsPlaying}
        isPaused={eventIsPaused}
        loaded={loaded}
        disablePlayback={skip || isRolling}
      />
      {!skip && (
        <EventBlockChip
          className={style.chipSection}
          id={eventId}
          timeStart={timeStart}
          delay={delay}
          dayOffset={dayOffset}
          isLinkedToLoaded={isLinkedToLoaded}
          isPast={isPast}
          isLoaded={loaded}
          totalGap={totalGap}
          duration={duration}
        />
      )}
      <div className={style.statusElements} id='block-status' data-timertype={timerType}>
        <span className={style.eventNote}>{note}</span>
        <div className={loaded ? style.progressBg : `${style.progressBg} ${style.hidden}`}>
          {loaded && <EventBlockProgressBar />}
        </div>
        <div className={style.eventStatus} tabIndex={-1}>
          <Tooltip label={`Time type: ${timerType}`} openDelay={tooltipDelayMid}>
            <span>
              <TimerIcon type={timerType} className={style.statusIcon} />
            </span>
          </Tooltip>
          <Tooltip label={`End action: ${endAction}`} openDelay={tooltipDelayMid}>
            <span>
              <EndActionIcon action={endAction} className={style.statusIcon} />
            </span>
          </Tooltip>
          <Tooltip label={`${countToEnd ? 'Count to End' : 'Count duration'}`} openDelay={tooltipDelayMid}>
            <span>
              <IoFlag className={`${style.statusIcon} ${countToEnd ? style.active : style.disabled}`} />
            </span>
          </Tooltip>
          <Tooltip label='Event has Triggers' openDelay={tooltipDelayMid}>
            <span>
              <IoFlash className={`${style.statusIcon} ${hasTriggers ? style.active : style.disabled}`} />
            </span>
          </Tooltip>
        </div>
      </div>
    </>
  );
}

export default memo(EventBlockInner);

function EndActionIcon(props: { action: EndAction; className: string }) {
  const { action, className } = props;
  const maybeActiveClasses = cx([action !== EndAction.None && style.active, className]);

  if (action === EndAction.LoadNext) {
    return <IoPlaySkipForward className={maybeActiveClasses} />;
  }
  if (action === EndAction.PlayNext) {
    return <IoPlayForward className={maybeActiveClasses} />;
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
  if (type === TimerType.None) {
    return <IoBan className={className} />;
  }
  return <IoArrowDown className={className} />;
}
