import {
  EntryId,
  OntimeEntry,
  OntimeEvent,
  OntimeGroup,
  OntimeView,
  PlayableEvent,
  isOntimeEvent,
  isOntimeGroup,
  isPlayableEvent,
} from 'ontime-types';
import { useMemo, useState } from 'react';
import { IoAdd } from 'react-icons/io5';

import Button from '../../common/components/buttons/Button';
import Empty from '../../common/components/state/Empty';
import EmptyPage from '../../common/components/state/EmptyPage';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useAutoTickingClock } from '../../common/hooks/useAutoTickingClock';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import { useTranslation } from '../../translation/TranslationProvider';
import Loader from '../common/loader/Loader';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getCountdownOptions, useCountdownOptions } from './countdown.options';
import { getOrderedSubscriptions, resolveSubscriptionTarget } from './countdown.utils';
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

  // gather subscribable items: playable events and groups that contain at least one playable child
  const candidates = rundownData.filter((entry): entry is ExtendedEntry<PlayableEvent | OntimeGroup> => {
    if (isOntimeEvent(entry)) {
      return isPlayableEvent(entry);
    }
    if (isOntimeGroup(entry)) {
      return rundownData.some((item) => isOntimeEvent(item) && isPlayableEvent(item) && item.parent === entry.id);
    }
    return false;
  });

  // gather presentation data
  const hasEvents = candidates.length > 0;

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

      {!hasEvents && (
        <div className='empty-state'>
          <Empty text={getLocalizedString('common.no_data')} className='empty-state__content' />
        </div>
      )}

      {hasEvents && editMode && (
        <CountdownSelect events={candidates} subscriptions={subscriptions} disableEdit={() => setEditMode(false)} />
      )}

      {hasEvents && !editMode && (
        <CountdownContents
          candidates={candidates}
          rundownData={rundownData}
          subscriptions={subscriptions}
          goToEditMode={() => setEditMode(true)}
        />
      )}
    </div>
  );
}

interface CountdownContentsProps {
  candidates: ExtendedEntry<OntimeEvent | OntimeGroup>[];
  rundownData: ExtendedEntry<OntimeEntry>[];
  subscriptions: EntryId[];
  goToEditMode: () => void;
}

function CountdownContents({ candidates, rundownData, subscriptions, goToEditMode }: CountdownContentsProps) {
  const { getLocalizedString } = useTranslation();
  const { hidePast } = useCountdownOptions();

  if (subscriptions.length === 0) {
    return (
      <div className='empty-state'>
        <Empty text={getLocalizedString('countdown.select_event')} className='empty-state__content' />
        <Button variant='primary' size='xlarge' onClick={goToEditMode}>
          <IoAdd /> Add
        </Button>
      </div>
    );
  }

  const subscribedEvents = getOrderedSubscriptions(subscriptions, candidates)
    .map((entry) => resolveSubscriptionTarget(entry, rundownData))
    .filter((target): target is NonNullable<typeof target> => target !== null);
  const eventsToShow = !hidePast ? subscribedEvents : subscribedEvents.filter((event) => !event.isPast);

  if (subscribedEvents.length === 0) {
    return (
      <div className='empty-state'>
        <Empty text={getLocalizedString('countdown.select_event')} className='empty-state__content' />
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
      <div className='empty-state'>
        <Empty text={getLocalizedString('countdown.all_have_finished')} className='empty-state__content' />
      </div>
    );
  }

  return <CountdownSubscriptions subscribedEvents={eventsToShow} goToEditMode={goToEditMode} />;
}

function CountdownClock() {
  const { timeformat } = useCountdownOptions();
  const { getLocalizedString } = useTranslation();
  const clock = useAutoTickingClock();

  // gather timer data
  const formattedClock = formatTime(clock, { override: timeformat });

  return (
    <div className='clock-container'>
      <div className='label'>{getLocalizedString('common.time_now')}</div>
      <SuperscriptTime time={formattedClock} className='time' />
    </div>
  );
}
