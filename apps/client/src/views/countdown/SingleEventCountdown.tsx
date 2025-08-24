import { IoPencil } from 'react-icons/io5';
import { OntimeEvent } from 'ontime-types';

import Button from '../../common/components/buttons/Button';
import { useFadeOutOnInactivity } from '../../common/hooks/useFadeOutOnInactivity';
import { useCountdownSocket, useCurrentDay, useRuntimeOffset, useSelectedEventId } from '../../common/hooks/useSocket';
import { cx } from '../../common/utils/styleUtils';
import { useTranslation } from '../../translation/TranslationProvider';

import { useCountdownOptions } from './countdown.options';
import { getSubscriptionDisplayData, timerProgress } from './countdown.utils';

import './SingleEventCountdown.scss';

interface SingleEventCountdownProps {
  subscribedEvent: OntimeEvent;
  goToEditMode: () => void;
}

export default function SingleEventCountdown({ subscribedEvent, goToEditMode }: SingleEventCountdownProps) {
  const showFab = useFadeOutOnInactivity(true);

  return (
    <div className='single-container' data-testid='countdown-event'>
      <SubscriptionStatus event={subscribedEvent} />
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
  event: OntimeEvent;
}

function SubscriptionStatus({ event }: SubscriptionStatusProps) {
  const { getLocalizedString } = useTranslation();
  const { selectedEventId } = useSelectedEventId();
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
      <div className='event__status'>{getLocalizedString(timerProgress[status])}</div>
      <div className='event__timer'>{timer}</div>
    </>
  );
}
