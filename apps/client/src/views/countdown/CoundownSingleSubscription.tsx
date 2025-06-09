import { EntryId, OntimeEvent } from 'ontime-types';

import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { useTranslation } from '../../translation/TranslationProvider';

import { TimerMessage } from './countdown.utils';

interface CountdownSingleSubscriptionProps {
  playableEvents: OntimeEvent[];
  selectedId: EntryId | null;
  subscriptionId: EntryId;
  time: ViewExtendedTimer;
  goToEditMode: () => void;
}

export default function CountdownSingleSubscription(props: CountdownSingleSubscriptionProps) {
  const { playableEvents, selectedId, subscriptionId, time, goToEditMode } = props;
  const { getLocalizedString } = useTranslation();

  const eventData = playableEvents.find((event) => event.id === subscriptionId);

  return (
    <div className='single-container'>
      {runningMessage !== TimerMessage.unhandled && (
        <div className='status'>{getLocalizedString(`countdown.${runningMessage}`)}</div>
      )}

      <SuperscriptTime
        time={formattedTimer}
        className={`timer ${standby ? 'timer--paused' : ''} ${isRunningFinished ? 'timer--finished' : ''}`}
      />
      {follow?.title && <div className='title'>{follow.title}</div>}

      <div className='timer-group'>
        {projectedStart && projectedEnd && (
          <div className='timer-group__projected-start'>
            <div className='timer-group__label'>{getLocalizedString('common.projected_start')}</div>
            <SuperscriptTime time={projectedStart} className={`timer-group__value ${delayedTimerStyles}`} />
          </div>
        )}
        {projectedStart && projectedEnd && (
          <div className='timer-group__projected-end'>
            <div className='timer-group__label'>{getLocalizedString('common.projected_end')}</div>
            <SuperscriptTime time={projectedEnd} className={`timer-group__value ${delayedTimerStyles}`} />
          </div>
        )}
        <div className='timer-group__scheduled-start'>
          <div className='timer-group__label'>{getLocalizedString('common.scheduled_start')}</div>
          <SuperscriptTime time={scheduledStart} className={`timer-group__value ${delayedTimerStyles}`} />
        </div>
        <div className='timer-group__scheduled-end'>
          <div className='timer-group__label'>{getLocalizedString('common.scheduled_end')}</div>
          <SuperscriptTime time={scheduledEnd} className={`timer-group__value ${delayedTimerStyles}`} />
        </div>
      </div>
    </div>
  );
}
