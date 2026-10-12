import { IoPencil } from 'react-icons/io5';

import Button from '../../common/components/buttons/Button';
import useReport from '../../common/hooks-query/useReport';
import { useFadeOutOnInactivity } from '../../common/hooks/useFadeOutOnInactivity';
import { useExpectedScheduleData } from '../../common/hooks/useSocket';
import { cx } from '../../common/utils/styleUtils';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getPropertyValue } from '../common/viewUtils';
import { useCountdownOptions } from './countdown.options';
import { CountdownEvent, CountdownTarget, extendEventData, useSubscriptionDisplayData } from './countdown.utils';
import { ScheduleTime } from './CountdownSubscriptions';

import './SingleEventCountdown.scss';

interface SingleEventCountdownProps {
  subscribedEvent: CountdownTarget;
  goToEditMode: () => void;
}

export default function SingleEventCountdown({ subscribedEvent, goToEditMode }: SingleEventCountdownProps) {
  const { mainSource, secondarySource, showExpected } = useCountdownOptions();
  const showFab = useFadeOutOnInactivity(true);
  const { data: reportData } = useReport();

  const { offset, currentDay, actualStart, plannedStart, mode } = useExpectedScheduleData();
  const countdownEvent = extendEventData(
    subscribedEvent,
    currentDay,
    actualStart,
    plannedStart,
    offset,
    mode,
    reportData,
  );
  const titleTmp = getPropertyValue(subscribedEvent, mainSource ?? 'title');
  const title = titleTmp?.length ? titleTmp : ' '; // insert utf-8 empty space to avoid the line collapsing;
  // while a group is live, surface the running event's title as the secondary line
  const liveTitle = subscribedEvent.isGroup && subscribedEvent.liveEntry ? subscribedEvent.liveEntry.title : undefined;
  const secondaryData = liveTitle ?? getPropertyValue(subscribedEvent, secondarySource);

  return (
    <div className='single-container' data-testid='countdown-event'>
      <SubscriptionStatus event={countdownEvent} />
      <div
        className={cx(['event__title', subscribedEvent.skip && 'event__title--skipped'])}
        style={{ borderColor: countdownEvent.colour }}
      >
        {!subscribedEvent.skip && <ScheduleTime event={countdownEvent} showExpected={showExpected} />}
        {title}
        {secondaryData && <div className='secondary'>{secondaryData}</div>}
      </div>
      <div className={cx(['fab-container', !showFab && 'fab-container--hidden'])}>
        <Button variant='primary' size='xlarge' onClick={goToEditMode}>
          <IoPencil /> Edit
        </Button>
      </div>
    </div>
  );
}

interface SubscriptionStatusProps {
  event: CountdownEvent;
}

function SubscriptionStatus({ event }: SubscriptionStatusProps) {
  const { status, statusDisplay, timeDisplay } = useSubscriptionDisplayData(event);

  if (status === 'skipped') {
    return <div className='event__status'>{statusDisplay}</div>;
  }

  return (
    <>
      <div className='event__status'>{statusDisplay}</div>
      {status === 'done' ? (
        <SuperscriptTime className='event__timer' time={timeDisplay} />
      ) : (
        <div className='event__timer'>{timeDisplay}</div>
      )}
    </>
  );
}
