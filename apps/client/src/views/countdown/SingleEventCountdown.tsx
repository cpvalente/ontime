import { IoPencil } from 'react-icons/io5';
import { MaybeNumber, OntimeEvent, TimerType } from 'ontime-types';
import { getExpectedStart } from 'ontime-utils';

import Button from '../../common/components/buttons/Button';
import { useFadeOutOnInactivity } from '../../common/hooks/useFadeOutOnInactivity';
import { useCountdownSocket, useExpectedStartData } from '../../common/hooks/useSocket';
import useReport from '../../common/hooks-query/useReport';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { cx } from '../../common/utils/styleUtils';
import { getFormattedTimer, getPropertyValue } from '../../features/viewers/common/viewUtils';
import { useTranslation } from '../../translation/TranslationProvider';

import { useCountdownOptions } from './countdown.options';
import { getSubscriptionDisplayData, timerProgress } from './countdown.utils';
import { ScheduleTime } from './CountdownSubscriptions';

import './SingleEventCountdown.scss';

interface SingleEventCountdownProps {
  subscribedEvent: ExtendedEntry<OntimeEvent>;
  goToEditMode: () => void;
}

export default function SingleEventCountdown({ subscribedEvent, goToEditMode }: SingleEventCountdownProps) {
  const { secondarySource, showExpected } = useCountdownOptions();
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
  const title = subscribedEvent.title ? subscribedEvent.title : ' '; // insert utf-8 empty space to avoid the line collapsing
  const secondaryData = getPropertyValue(subscribedEvent, secondarySource);

  return (
    <div className='single-container' data-testid='countdown-event'>
      <ScheduleTime event={countdownEvent} showExpected={showExpected} />
      <SubscriptionStatus event={countdownEvent} />
      <div className='event__title' style={{ borderColor: countdownEvent.colour }}>
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
  const { getLocalizedString } = useTranslation();
  const { playback, current, clock } = useCountdownSocket();

  const { status, timer } = getSubscriptionDisplayData(current, playback, clock, event);

  return (
    <>
      <div className='event__status'>{getLocalizedString(timerProgress[status])}</div>
      <div className='event__timer'>
        {getFormattedTimer(timer, TimerType.CountDown, getLocalizedString('common.minutes'), {
          removeSeconds: true,
          removeLeadingZero: true,
        })}
      </div>
    </>
  );
}
