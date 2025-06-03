import { IoPencil } from 'react-icons/io5';
import { EntryId, OntimeEvent, Playback } from 'ontime-types';

import Button from '../../common/components/buttons/Button';
import { useFadeOutOnInactivity } from '../../common/hooks/useFadeOutOnInactivity';
import { useCurrentDay, useRuntimeOffset } from '../../common/hooks/useSocket';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { cx } from '../../common/utils/styleUtils';
import ClockTime from '../../features/viewers/common/clock-time/ClockTime';
import { getPropertyValue } from '../../features/viewers/common/viewUtils';
import { useTranslation } from '../../translation/TranslationProvider';

import { useCountdownOptions } from './countdown.options';
import { getOrderedSubscriptions, getSubscriptionDisplayData, sanitiseTitle, timerProgress } from './countdown.utils';

import './Countdown.scss';

interface CountdownSubscriptionsProps {
  events: OntimeEvent[];
  selectedId: EntryId | null;
  subscriptions: EntryId[];
  time: ViewExtendedTimer;
  goToEditMode: () => void;
}

export default function CountdownSubscriptions(props: CountdownSubscriptionsProps) {
  const { time, events, selectedId, goToEditMode } = props;
  const { secondarySource, subscriptions, showProjected } = useCountdownOptions();
  const showFab = useFadeOutOnInactivity(true);

  // TODO: add follow selected

  // gather data
  const subscribedEvents = getOrderedSubscriptions(subscriptions, events);

  return (
    <div className='list-container'>
      {subscribedEvents.map((event) => {
        const secondaryData = getPropertyValue(event, secondarySource);
        const isLive = event.id === selectedId && time.playback !== Playback.Armed;

        return (
          <div key={event.id} className={cx(['sub', isLive && 'sub--live'])}>
            <div className='sub__binder' style={{ '--user-color': event.colour }} />
            <div className={cx(['sub__schedule', event.delay > 0 && 'sub__schedule--delayed'])}>
              {showProjected ? (
                <ProjectedSchedule timeStart={event.timeStart} timeEnd={event.timeEnd} delay={event.delay} />
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
        <Button variant='primary' size='large' disabled={events.length < 1} onClick={goToEditMode}>
          <IoPencil /> Edit
        </Button>
      </div>
    </div>
  );
}

interface ProjectedScheduleProps {
  timeStart: number;
  timeEnd: number;
  delay: number;
}
function ProjectedSchedule(props: ProjectedScheduleProps) {
  const { timeStart, timeEnd, delay } = props;

  const { offset } = useRuntimeOffset();

  // offset is negative if we are ahead
  const projectedOffset = offset - delay;

  const classes = cx([projectedOffset > 0 && 'sub__schedule--ahead', projectedOffset < 0 && 'sub__schedule--behind']);

  return (
    <>
      <ClockTime
        value={timeStart - projectedOffset}
        className={classes}
        preferredFormat12='h:mm'
        preferredFormat24='HH:mm'
      />
      →
      <ClockTime value={timeEnd - projectedOffset} preferredFormat12='h:mm' preferredFormat24='HH:mm' />
    </>
  );
}

interface SubscriptionStatusProps {
  time: ViewExtendedTimer;
  event: OntimeEvent;
  selectedId: EntryId | null;
}

function SubscriptionStatus(props: SubscriptionStatusProps) {
  const { time, event, selectedId } = props;

  const { getLocalizedString } = useTranslation();
  const { currentDay } = useCurrentDay();
  const { offset } = useRuntimeOffset();
  const { showProjected } = useCountdownOptions();

  // TODO: use reporter values as in the event block chip
  const { status, timer } = getSubscriptionDisplayData(
    time,
    event,
    selectedId,
    offset,
    currentDay,
    getLocalizedString('common.minutes'),
    showProjected,
  );

  return (
    <>
      <div className='sub__status'>{getLocalizedString(timerProgress[status])}</div>
      <div className='sub__timer'>{timer}</div>
    </>
  );
}
