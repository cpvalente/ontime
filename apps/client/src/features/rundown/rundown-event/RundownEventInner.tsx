import { memo, useEffect, useState } from 'react';
import {
  IoArrowDown,
  IoArrowUp,
  IoBan,
  IoFlash,
  IoPlay,
  IoPlayForward,
  IoPlaySkipForward,
  IoTime,
} from 'react-icons/io5';
import { LuArrowDownToLine } from 'react-icons/lu';
import { EndAction, Playback, TimerType, TimeStrategy } from 'ontime-types';

import Tooltip from '../../../common/components/tooltip/Tooltip';
import { cx } from '../../../common/utils/styleUtils';
import TitleEditor from '../common/TitleEditor';
import TimeInputFlow from '../time-input-flow/TimeInputFlow';

import RundownEventChip from './composite/RundownEventChip';
import EventBlockPlayback from './composite/RundownEventPlayback';
import EventBlockProgressBar from './composite/RundownEventProgressBar';

import style from './RundownEvent.module.scss';

interface RundownEventInnerProps {
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

export default memo(RundownEventInner);
function RundownEventInner({
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
}: RundownEventInnerProps) {
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
        <TitleEditor title={title} entryId={eventId} placeholder='Event title' className={style.eventTitle} />
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
        <RundownEventChip
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
      <div className={style.statusElements} id='entry-status' data-timertype={timerType}>
        <span className={style.eventNote}>{note}</span>
        <div className={loaded ? style.progressBg : `${style.progressBg} ${style.hidden}`}>
          {loaded && <EventBlockProgressBar />}
        </div>
        <div className={style.eventStatus} tabIndex={-1}>
          <Tooltip text={`Time type: ${timerType}`} render={<span />}>
            <TimerIcon type={timerType} className={style.statusIcon} />
          </Tooltip>
          <Tooltip text={`End action: ${endAction}`} render={<span />}>
            <EndActionIcon action={endAction} className={style.statusIcon} />
          </Tooltip>
          <Tooltip text={`${countToEnd ? 'Count to End' : 'Count duration'}`} render={<span />}>
            <LuArrowDownToLine className={`${style.statusIcon} ${countToEnd ? style.active : style.disabled}`} />
          </Tooltip>
          <Tooltip text='Event has Triggers' render={<span />}>
            <IoFlash className={`${style.statusIcon} ${hasTriggers ? style.active : style.disabled}`} />
          </Tooltip>
        </div>
      </div>
    </>
  );
}

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
