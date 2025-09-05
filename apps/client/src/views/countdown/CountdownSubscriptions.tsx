import { useEffect, useRef, useState } from 'react';
import { IoPencil } from 'react-icons/io5';
import { EntryId, OntimeEvent } from 'ontime-types';
import { getExpectedStart } from 'ontime-utils';

import Button from '../../common/components/buttons/Button';
import { useFadeOutOnInactivity } from '../../common/hooks/useFadeOutOnInactivity';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import {
  useCountdownSocket,
  useCurrentDay,
  useExpectedStartData,
  usePlayback,
  useRuntimeOffset,
  useSelectedEventId,
} from '../../common/hooks/useSocket';
import { getOffsetState } from '../../common/utils/offset';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { cx } from '../../common/utils/styleUtils';
import { throttle } from '../../common/utils/throttle';
import FollowButton from '../../features/operator/follow-button/FollowButton';
import ClockTime from '../../features/viewers/common/clock-time/ClockTime';
import { getPropertyValue } from '../../features/viewers/common/viewUtils';
import { useTranslation } from '../../translation/TranslationProvider';

import { useCountdownOptions } from './countdown.options';
import { getIsLive, getSubscriptionDisplayData, sanitiseTitle, timerProgress } from './countdown.utils';

import './Countdown.scss';

interface CountdownSubscriptionsProps {
  subscribedEvents: ExtendedEntry<OntimeEvent>[];
  goToEditMode: () => void;
}

export default function CountdownSubscriptions({ subscribedEvents, goToEditMode }: CountdownSubscriptionsProps) {
  const { secondarySource, showExpected } = useCountdownOptions();
  const { playback } = usePlayback();
  const { selectedEventId } = useSelectedEventId();
  const showFab = useFadeOutOnInactivity(true);

  const countdownEvents = useCountdownEvents(subscribedEvents);

  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const [lockAutoScroll, setLockAutoScroll] = useState(false);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollToComponent = useFollowComponent({
    followRef: selectedRef,
    scrollRef,
    doFollow: !lockAutoScroll,
    topOffset: 0,
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
      {countdownEvents.map((event) => {
        const secondaryData = getPropertyValue(event, secondarySource);
        const isLive = getIsLive(event.id, selectedEventId, playback);

        return (
          <div key={event.id} ref={isLive ? selectedRef : undefined} className={cx(['sub', isLive && 'sub--live'])}>
            <div className='sub__binder' style={{ '--user-color': event.colour }} />
            <div className={cx(['sub__schedule', event.delay > 0 && 'sub__schedule--delayed'])}>
              {showExpected ? (
                <ExpectedSchedule
                  timeStart={event.expectedStart}
                  duration={event.duration}
                  state={getOffsetState(event.expectedStart - event.timeStart)}
                />
              ) : (
                <ExpectedSchedule timeStart={event.timeStart + event.delay} duration={event.duration} state={null} />
              )}
            </div>
            <SubscriptionStatus event={event} />
            <div className={cx(['sub__title', !event.title && 'subdued'])}>{sanitiseTitle(event.title)}</div>
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

interface ExpectedScheduleProps {
  timeStart: number;
  duration: number;
  state: 'over' | 'under' | 'muted' | null;
}
function ExpectedSchedule(props: ExpectedScheduleProps) {
  const { timeStart, duration, state } = props;

  return (
    <>
      <ClockTime
        value={timeStart}
        className={`sub__schedule--${state}`}
        preferredFormat12='h:mm'
        preferredFormat24='HH:mm'
      />
      →
      <ClockTime value={timeStart + duration} preferredFormat12='h:mm' preferredFormat24='HH:mm' />
      {/* TODO: if cound to end then the end time would not move */}
    </>
  );
}

interface SubscriptionStatusProps {
  event: OntimeEvent;
  selectedEventId: EntryId | null;
}

function SubscriptionStatus({ event, selectedEventId }: SubscriptionStatusProps) {
  const { getLocalizedString } = useTranslation();
  const { currentDay } = useCurrentDay();
  const { offset } = useRuntimeOffset();
  const { showExpected } = useCountdownOptions();
  const { playback, current, clock } = useCountdownSocket();

  // TODO: use reporter values as in the event block chip
  const { status, timer } = getSubscriptionDisplayData(
    current,
    playback,
    clock,
    event,
    selectedEventId,
    offset,
    currentDay,
    getLocalizedString('common.minutes'),
    showExpected,
  );

  return (
    <>
      <div className='sub__status'>{getLocalizedString(timerProgress[status])}</div>
      <div className='sub__timer'>{timer}</div>
    </>
  );
}

function useCountdownEvents(subscribedEvents: ExtendedEntry<OntimeEvent>[]) {
  const { offset, currentDay, actualStart, plannedStart, mode } = useExpectedStartData();
  return subscribedEvents.map((event) => {
    const { totalGap, isLinkedToLoaded } = event;
    const expectedStart = getExpectedStart(event, {
      currentDay,
      totalGap,
      actualStart,
      plannedStart,
      isLinkedToLoaded,
      offset,
      mode,
    });
    return { ...event, expectedStart };
  });
}
