import { MaybeNumber, OntimeEvent } from 'ontime-types';
import { getExpectedStart } from 'ontime-utils';
import { IoPencil } from 'react-icons/io5';

import Button from '../../common/components/buttons/Button';
import useReport from '../../common/hooks-query/useReport';
import { useFadeOutOnInactivity } from '../../common/hooks/useFadeOutOnInactivity';
import { useExpectedStartData } from '../../common/hooks/useSocket';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { cx } from '../../common/utils/styleUtils';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getPropertyValue } from '../common/viewUtils';
import { useCountdownOptions } from './countdown.options';
import { useSubscriptionDisplayData } from './countdown.utils';
import { ScheduleTime } from './CountdownSubscriptions';

import './SingleEventCountdown.scss';

interface SingleEventCountdownProps {
  subscribedEvent: ExtendedEntry<OntimeEvent>;
  goToEditMode: () => void;
}

export default function SingleEventCountdown({ subscribedEvent, goToEditMode }: SingleEventCountdownProps) {
  const { mainSource, secondarySource, showExpected } = useCountdownOptions();
  const showFab = useFadeOutOnInactivity(true);
  const { data: reportData } = useReport();

  const { offset, currentDay, actualStart, plannedStart, mode } = useExpectedStartData();
  const { totalGap, isLinkedToLoaded } = subscribedEvent;
  const expectedStart = getExpectedStart(subscribedEvent, {
    currentDay,
    totalGap,
    actualStart,
    plannedStart,
    isLinkedToLoaded,
    offset,
    mode,
  });

  const { endedAt } = reportData[subscribedEvent.id] ?? { endedAt: null };
  const countdownEvent = { ...subscribedEvent, expectedStart, endedAt };
  const titleTmp = getPropertyValue(subscribedEvent, mainSource ?? 'title');
  const title = titleTmp?.length ? titleTmp : ' '; // insert utf-8 empty space to avoid the line collapsing;
  const secondaryData = getPropertyValue(subscribedEvent, secondarySource);

  return (
    <div className='single-container' data-testid='countdown-event'>
      <SubscriptionStatus event={countdownEvent} />
      <div className='event__title' style={{ borderColor: countdownEvent.colour }}>
        <ScheduleTime event={countdownEvent} showExpected={showExpected} />
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
  event: ExtendedEntry<OntimeEvent> & { endedAt: MaybeNumber; expectedStart: number };
}

function SubscriptionStatus({ event }: SubscriptionStatusProps) {
  const { status, statusDisplay, timeDisplay } = useSubscriptionDisplayData(event);

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
