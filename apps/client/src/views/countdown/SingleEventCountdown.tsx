import { IoPencil } from 'react-icons/io5';
import { MaybeNumber, OntimeEvent, TimerType } from 'ontime-types';
import { getExpectedStart } from 'ontime-utils';

import Button from '../../common/components/buttons/Button';
import { useFadeOutOnInactivity } from '../../common/hooks/useFadeOutOnInactivity';
import {
  useCountdownSocket,
  useCurrentDay,
  useExpectedStartData,
  useRuntimeOffset,
} from '../../common/hooks/useSocket';
import useReport from '../../common/hooks-query/useReport';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { cx } from '../../common/utils/styleUtils';
import { getFormattedTimer } from '../../features/viewers/common/viewUtils';
import { useTranslation } from '../../translation/TranslationProvider';

import { useCountdownOptions } from './countdown.options';
import { getSubscriptionDisplayData, timerProgress } from './countdown.utils';

import './SingleEventCountdown.scss';

interface SingleEventCountdownProps {
  subscribedEvent: ExtendedEntry<OntimeEvent>;
  goToEditMode: () => void;
}

export default function SingleEventCountdown({ subscribedEvent, goToEditMode }: SingleEventCountdownProps) {
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

  return (
    <div className='single-container' data-testid='countdown-event'>
      <SubscriptionStatus event={countdownEvent} />
      <div className='event__title'>{subscribedEvent.title}</div>
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
    offset,
    currentDay,
    showExpected,
  );

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
