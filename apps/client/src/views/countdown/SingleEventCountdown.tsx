import { MaybeNumber, OntimeEvent } from 'ontime-types';
import { getExpectedStart } from 'ontime-utils';
import { IoPencil } from 'react-icons/io5';

import Button from '../../common/components/buttons/Button';
import TitleCard from '../../common/components/title-card/TitleCard';
import useReport from '../../common/hooks-query/useReport';
import { useFadeOutOnInactivity } from '../../common/hooks/useFadeOutOnInactivity';
import { useExpectedStartData } from '../../common/hooks/useSocket';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { cx } from '../../common/utils/styleUtils';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getPropertyValue } from '../common/viewUtils';
import { useCountdownOptions } from './countdown.options';

import './SingleEventCountdown.scss';
import { useSubscriptionDisplayData } from './countdown.utils';

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
  const title = getPropertyValue(subscribedEvent, mainSource ?? 'title');
  const secondaryData = getPropertyValue(subscribedEvent, secondarySource);

  return (
    <div className='single-container' data-testid='countdown-event'>
      <SubscriptionStatus event={subscribedEvent} expectedStart={expectedStart} endedAt={endedAt} />
      <TitleCard
        title={title}
        secondary={secondaryData}
        colour={subscribedEvent.colour}
        textAlign='center'
        size='lg'
        event={subscribedEvent}
        showExpected={showExpected}
        expectedStart={expectedStart}
      />
      <div className={cx(['fab-container', !showFab && 'fab-container--hidden'])}>
        <Button variant='primary' size='xlarge' onClick={goToEditMode}>
          <IoPencil /> Edit
        </Button>
      </div>
    </div>
  );
}

interface SubscriptionStatusProps {
  event: ExtendedEntry<OntimeEvent>;
  endedAt: MaybeNumber;
  expectedStart: number;
}

function SubscriptionStatus({ event, endedAt, expectedStart }: SubscriptionStatusProps) {
  const { status, statusDisplay, timeDisplay } = useSubscriptionDisplayData(event, endedAt, expectedStart);

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
