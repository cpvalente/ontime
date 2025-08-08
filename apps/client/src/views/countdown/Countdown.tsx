import { useMemo, useState } from 'react';
import { IoAdd } from 'react-icons/io5';
import { EntryId, isOntimeEvent, isPlayableEvent, OntimeEvent, OntimeView } from 'ontime-types';

import Button from '../../common/components/buttons/Button';
import Empty from '../../common/components/state/Empty';
import EmptyPage from '../../common/components/state/EmptyPage';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useClock } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { useTranslation } from '../../translation/TranslationProvider';
import Loader from '../common/loader/Loader';

import { getCountdownOptions, useCountdownOptions } from './countdown.options';
import { getOrderedSubscriptions } from './countdown.utils';
import CountdownSelect from './CountdownSelect';
import CountdownSubscriptions from './CountdownSubscriptions';
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

function Countdown({ customFields, events, projectData, isMirrored, settings }: CountdownData) {
  const { getLocalizedString } = useTranslation();
  const { subscriptions } = useCountdownOptions();

  const [editMode, setEditMode] = useState(false);

  // gather rundown data
  const playableEvents = events.filter((event) => isOntimeEvent(event) && isPlayableEvent(event));

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
  playableEvents: OntimeEvent[];
  subscriptions: EntryId[];
  goToEditMode: () => void;
}

function CountdownContents({ playableEvents, subscriptions, goToEditMode }: CountdownContentsProps) {
  const { getLocalizedString } = useTranslation();

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

  return <CountdownSubscriptions subscribedEvents={subscribedEvents} goToEditMode={goToEditMode} />;
}

function CountdownClock() {
  const { getLocalizedString } = useTranslation();
  const { clock } = useClock();

  // gather timer data
  const formattedClock = formatTime(clock);

  return (
    <div className='clock-container'>
      <div className='label'>{getLocalizedString('common.time_now')}</div>
      <SuperscriptTime time={formattedClock} className='time' />
    </div>
  );
}
