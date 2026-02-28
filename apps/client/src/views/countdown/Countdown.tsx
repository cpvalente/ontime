import { EntryId, OntimeEvent, OntimeView, PlayableEvent, isOntimeEvent, isPlayableEvent } from 'ontime-types';
import { useMemo, useState } from 'react';
import { IoAdd } from 'react-icons/io5';

import Button from '../../common/components/buttons/Button';
import Empty from '../../common/components/state/Empty';
import EmptyPage from '../../common/components/state/EmptyPage';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useClock } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import { useTranslation } from '../../translation/TranslationProvider';
import Loader from '../common/loader/Loader';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getCountdownOptions, useCountdownOptions } from './countdown.options';
import { getOrderedSubscriptions } from './countdown.utils';
import CountdownSelect from './CountdownSelect';
import CountdownSubscriptions from './CountdownSubscriptions';
import SingleEventCountdown from './SingleEventCountdown';
import { CountdownData, useCountdownData } from './useCountdownData';

import './Countdown.scss';

export default function CountdownLoader() {
  const { data, status } = useCountdownData();

  useWindowTitle('Countdown');

  if (status === 'pending') {
    return <Loader />;
  }

  if (status === 'error') {
    return <EmptyPage text='There was an error fetching data, please refresh the page.' />;
  }

  return <Countdown {...data} />;
}

function Countdown({ customFields, rundownData, projectData, isMirrored, settings }: CountdownData) {
  const { getLocalizedString } = useTranslation();
  const { subscriptions } = useCountdownOptions();

  const [editMode, setEditMode] = useState(false);

  // gather rundown data
  const playableEvents = rundownData.filter((entry): entry is ExtendedEntry<PlayableEvent> => {
    return isOntimeEvent(entry) && isPlayableEvent(entry);
  });

  // gather presentation data
  const hasEvents = playableEvents.length > 0;

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const countdownOptions = useMemo(
    () => getCountdownOptions(defaultFormat, customFields, subscriptions),
    [defaultFormat, customFields, subscriptions],
  );

  return (
    <div className={`countdown ${isMirrored ? 'mirror' : ''}`} data-testid='countdown-view'>
      <ViewParamsEditor target={OntimeView.Countdown} viewOptions={countdownOptions} />
      <div className='project-header'>
        {projectData?.logo && <ViewLogo name={projectData.logo} className='logo' />}
        <div className='title'>{projectData.title}</div>
        <CountdownClock />
      </div>

      {!hasEvents && <Empty text={getLocalizedString('common.no_data')} className='empty-container' />}

      {hasEvents && editMode && (
        <CountdownSelect events={playableEvents} subscriptions={subscriptions} disableEdit={() => setEditMode(false)} />
      )}

      {hasEvents && !editMode && (
        <CountdownContents
          playableEvents={playableEvents}
          subscriptions={subscriptions}
          goToEditMode={() => setEditMode(true)}
        />
      )}
    </div>
  );
}

interface CountdownContentsProps {
  playableEvents: ExtendedEntry<OntimeEvent>[];
  subscriptions: EntryId[];
  goToEditMode: () => void;
}

function CountdownContents({ playableEvents, subscriptions, goToEditMode }: CountdownContentsProps) {
  const { getLocalizedString } = useTranslation();
  const { hidePast } = useCountdownOptions();

  if (subscriptions.length === 0) {
    return (
      <div className='empty-container'>
        <Empty text={getLocalizedString('countdown.select_event')} className='empty-container' />
        <Button variant='primary' size='xlarge' onClick={goToEditMode}>
          <IoAdd /> Add
        </Button>
      </div>
    );
  }

  const subscribedEvents = getOrderedSubscriptions(subscriptions, playableEvents);
  const eventsToShow = !hidePast ? subscribedEvents : subscribedEvents.filter((event) => !event.isPast);

  if (subscribedEvents.length === 0) {
    return (
      <div className='empty-container'>
        <Empty text={getLocalizedString('countdown.select_event')} className='empty-container' />
        <Button variant='primary' size='xlarge' onClick={goToEditMode}>
          <IoAdd /> Add
        </Button>
      </div>
    );
  }

  if (subscribedEvents.length === 1 && eventsToShow.length === 1) {
    const event = subscribedEvents.at(0);
    if (!event) return null;
    return <SingleEventCountdown subscribedEvent={event} goToEditMode={goToEditMode} />;
  }

  if (eventsToShow.length === 0) {
    return (
      <div className='empty-container'>
        <Empty text={getLocalizedString('countdown.all_have_finished')} className='empty-container' />
      </div>
    );
  }

  return <CountdownSubscriptions subscribedEvents={eventsToShow} goToEditMode={goToEditMode} />;
}

function CountdownClock() {
  const { getLocalizedString } = useTranslation();
  const clock = useClock();

  // gather timer data
  const formattedClock = formatTime(clock);

  return (
    <div className='clock-container'>
      <div className='label'>{getLocalizedString('common.time_now')}</div>
      <SuperscriptTime time={formattedClock} className='time' />
    </div>
  );
}
