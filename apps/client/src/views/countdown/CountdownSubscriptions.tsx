//FIXME: AI generated and not reviewed
import { useEffect, useRef, useState } from 'react';
import { IoPencil } from 'react-icons/io5';
import { MaybeNumber, OntimeEvent } from 'ontime-types';

import Button from '../../common/components/buttons/Button';
import ScheduleTime from '../../common/components/schedule-time/ScheduleTime';
import { useFadeOutOnInactivity } from '../../common/hooks/useFadeOutOnInactivity';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useExpectedStartData, usePlayback, useSelectedEventId } from '../../common/hooks/useSocket';
import useReport from '../../common/hooks-query/useReport';
import { expectedEventData, ExtendedEntry } from '../../common/utils/rundownMetadata';
import { cx } from '../../common/utils/styleUtils';
import { throttle } from '../../common/utils/throttle';
import FollowButton from '../../features/operator/follow-button/FollowButton';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getPropertyValue } from '../common/viewUtils';

import { useCountdownOptions } from './countdown.options';
import { getIsLive, useSubscriptionDisplayData } from './countdown.utils';

import './Countdown.scss';

interface CountdownSubscriptionsProps {
  subscribedEvents: ExtendedEntry<OntimeEvent>[];
  goToEditMode: () => void;
}

export default function CountdownSubscriptions({ subscribedEvents, goToEditMode }: CountdownSubscriptionsProps) {
  const { mainSource, secondarySource, showExpected } = useCountdownOptions();
  const { playback } = usePlayback();
  const { selectedEventId } = useSelectedEventId();
  const showFab = useFadeOutOnInactivity(true);

  const { data: reportData } = useReport();
  const { offset, currentDay, actualStart, plannedStart, mode } = useExpectedStartData();

  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const [lockAutoScroll, setLockAutoScroll] = useState(false);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollToComponent = useFollowComponent({
    followRef: selectedRef,
    scrollRef,
    doFollow: !lockAutoScroll,
    topOffset: 0,
    followTrigger: selectedEventId,
  });

  // reset scroll if nothing is selected
  useEffect(() => {
    if (!selectedEventId) {
      if (!lockAutoScroll) {
        scrollRef.current?.scrollTo(0, 0);
      }
    }
  }, [selectedEventId, lockAutoScroll, scrollRef]);

  // scroll to component if user clicks the Follow button
  const handleOffset = () => {
    if (selectedEventId) {
      scrollToComponent();
    }
    setLockAutoScroll(false);
  };

  // prevent considering automated scrolls as user scrolls
  const handleUserScroll = () => {
    if (selectedRef?.current && scrollRef?.current) {
      const selectedRect = selectedRef.current.getBoundingClientRect();
      const scrollerRect = scrollRef.current.getBoundingClientRect();
      if (selectedRect && scrollerRect) {
        const distanceFromTop = selectedRect.top - scrollerRect.top;
        const hasScrolledOutOfThreshold = distanceFromTop < -8 || distanceFromTop > 50;
        setLockAutoScroll(hasScrolledOutOfThreshold);
      }
    }
  };
  const throttledHandleScroll = throttle(handleUserScroll, 1000);

  // when the user scrolls we check if we need to show the button
  const handleScroll = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    throttledHandleScroll();
  };

  return (
    <div className='list-container' onWheel={handleScroll} onTouchMove={handleScroll} ref={scrollRef}>
      {subscribedEvents.map((event) => {
        const secondaryData = getPropertyValue(event, secondarySource);
        const isLive = getIsLive(event.id, selectedEventId, playback);
        const isArmed = !isLive && event.id === selectedEventId;
        const countdownEvent = expectedEventData(
          event,
          currentDay,
          actualStart,
          plannedStart,
          offset,
          mode,
          reportData,
        );
        const displayTitle = getPropertyValue(event, mainSource ?? 'title');
        return (
          <div
            key={event.id}
            ref={isLive ? selectedRef : undefined}
            className={cx(['sub', isLive && 'sub--live', isArmed && 'sub--armed'])}
            data-testid={event.cue}
          >
            <div className='sub__binder' style={{ '--user-color': event.colour }} />
            <ScheduleTime event={countdownEvent} showExpected={showExpected} className='sub__schedule' />
            <SubscriptionStatus event={countdownEvent} />
            <div className={cx(['sub__title', !displayTitle && 'subdued'])}>{displayTitle}</div>
            {secondaryData && <div className='sub__secondary'>{secondaryData}</div>}
          </div>
        );
      })}
      <div className={cx(['fab-container', !showFab && 'fab-container--hidden'])}>
        <Button variant='primary' size='xlarge' onClick={goToEditMode}>
          <IoPencil /> Edit
        </Button>
      </div>
      <FollowButton isVisible={lockAutoScroll} onClickHandler={handleOffset} />
    </div>
  );
}

interface SubscriptionStatusProps {
  event: ExtendedEntry<OntimeEvent> & { endedAt: MaybeNumber; expectedStart: number };
}

function SubscriptionStatus({ event }: SubscriptionStatusProps) {
  const { status, statusDisplay, timeDisplay } = useSubscriptionDisplayData(event);

  return (
    <>
      <div className='sub__status'>{statusDisplay}</div>
      {status === 'done' ? (
        <SuperscriptTime className='sub__timer' time={timeDisplay} />
      ) : (
        <div className='sub__timer'>{timeDisplay}</div>
      )}
    </>
  );
}
