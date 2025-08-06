import { useEffect, useRef, useState } from 'react';
import { IoPencil } from 'react-icons/io5';
import { EntryId, OntimeEvent } from 'ontime-types';

import Button from '../../common/components/buttons/Button';
import { useFadeOutOnInactivity } from '../../common/hooks/useFadeOutOnInactivity';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useCurrentDay, useRuntimeOffset } from '../../common/hooks/useSocket';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { getOffsetState } from '../../common/utils/offset';
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
  subscribedEvents: OntimeEvent[];
  selectedId: EntryId | null;
  time: ViewExtendedTimer;
  goToEditMode: () => void;
}

export default function CountdownSubscriptions({
  time,
  subscribedEvents,
  selectedId,
  goToEditMode,
}: CountdownSubscriptionsProps) {
  const { secondarySource, showExpected } = useCountdownOptions();
  const showFab = useFadeOutOnInactivity(true);

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
    if (!selectedId) {
      if (!lockAutoScroll) {
        scrollRef.current?.scrollTo(0, 0);
      }
    }
  }, [selectedId, lockAutoScroll, scrollRef]);

  // scroll to component if user clicks the Follow button
  const handleOffset = () => {
    if (selectedId) {
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
        const isLive = getIsLive(event.id, selectedId, time.playback);

        return (
          <div key={event.id} ref={isLive ? selectedRef : undefined} className={cx(['sub', isLive && 'sub--live'])}>
            <div className='sub__binder' style={{ '--user-color': event.colour }} />
            <div className={cx(['sub__schedule', event.delay > 0 && 'sub__schedule--delayed'])}>
              {showExpected ? (
                <ExpectedSchedule timeStart={event.timeStart} timeEnd={event.timeEnd} delay={event.delay} />
              ) : (
                <>
                  <ClockTime value={event.timeStart + event.delay} preferredFormat12='h:mm' preferredFormat24='HH:mm' />
                  →
                  <ClockTime value={event.timeEnd + event.delay} preferredFormat12='h:mm' preferredFormat24='HH:mm' />
                </>
              )}
            </div>
            <SubscriptionStatus key={event.id} event={event} selectedId={selectedId} time={time} />
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
  timeEnd: number;
  delay: number;
}
function ExpectedSchedule(props: ExpectedScheduleProps) {
  const { timeStart, timeEnd, delay } = props;

  const { offset } = useRuntimeOffset();

  // offset is negative if we are ahead
  const expectedOffset = offset - delay;
  const expectedState = getOffsetState(expectedOffset);

  return (
    <>
      <ClockTime
        value={timeStart - expectedOffset}
        className={`sub__schedule--${expectedState}`}
        preferredFormat12='h:mm'
        preferredFormat24='HH:mm'
      />
      →
      <ClockTime value={timeEnd - expectedOffset} preferredFormat12='h:mm' preferredFormat24='HH:mm' />
    </>
  );
}

interface SubscriptionStatusProps {
  time: ViewExtendedTimer;
  event: OntimeEvent;
  selectedId: EntryId | null;
}

function SubscriptionStatus({ time, event, selectedId }: SubscriptionStatusProps) {
  const { getLocalizedString } = useTranslation();
  const { currentDay } = useCurrentDay();
  const { offset } = useRuntimeOffset();
  const { showExpected } = useCountdownOptions();

  // TODO: use reporter values as in the event block chip
  const { status, timer } = getSubscriptionDisplayData(
    time,
    event,
    selectedId,
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
