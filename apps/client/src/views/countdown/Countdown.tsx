import { useMemo, useState } from 'react';
import { IoAdd } from 'react-icons/io5';
import {
  CustomFields,
  EntryId,
  isOntimeEvent,
  isPlayableEvent,
  OntimeEvent,
  ProjectData,
  Settings,
} from 'ontime-types';

import Button from '../../common/components/buttons/Button';
import Empty from '../../common/components/state/Empty';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { useTranslation } from '../../translation/TranslationProvider';

import { getCountdownOptions, useCountdownOptions } from './countdown.options';
import { getOrderedSubscriptions } from './countdown.utils';
import CountdownSelect from './CountdownSelect';
import CountdownSubscriptions from './CountdownSubscriptions';

import './Countdown.scss';

interface CountdownProps {
  customFields: CustomFields;
  events: OntimeEvent[];
  general: ProjectData;
  time: ViewExtendedTimer;
  isMirrored: boolean;
  selectedId: EntryId | null;
  settings: Settings | undefined;
}

export default function Countdown({
  customFields,
  events,
  general,
  time,
  isMirrored,
  selectedId,
  settings,
}: CountdownProps) {
  const { getLocalizedString } = useTranslation();
  const { subscriptions } = useCountdownOptions();
  const [editMode, setEditMode] = useState(false);

  useWindowTitle('Countdown');

  // gather rundown data
  const playableEvents = events.filter((event) => isOntimeEvent(event) && isPlayableEvent(event));

  // gather timer data
  const clock = formatTime(time.clock);

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
      <ViewParamsEditor viewOptions={countdownOptions} />
      <div className='project-header'>
        {general?.projectLogo && <ViewLogo name={general.projectLogo} className='logo' />}
        <div className='title'>{general.title}</div>
        <div className='clock-container'>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <SuperscriptTime time={clock} className='time' />
        </div>
      </div>

      {!hasEvents && <Empty text={getLocalizedString('common.no_data')} className='empty-container' />}

      {hasEvents && editMode && (
        <CountdownSelect events={playableEvents} subscriptions={subscriptions} disableEdit={() => setEditMode(false)} />
      )}

      {hasEvents && !editMode && (
        <CountdownContents
          playableEvents={playableEvents}
          subscriptions={subscriptions}
          time={time}
          goToEditMode={() => setEditMode(true)}
          selectedId={selectedId}
        />
      )}
    </div>
  );
}

interface CountdownContentsProps {
  playableEvents: OntimeEvent[];
  selectedId: EntryId | null;
  subscriptions: EntryId[];
  time: ViewExtendedTimer;
  goToEditMode: () => void;
}

function CountdownContents({ playableEvents, selectedId, subscriptions, time, goToEditMode }: CountdownContentsProps) {
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

  return (
    <CountdownSubscriptions
      subscribedEvents={subscribedEvents}
      selectedId={selectedId}
      time={time}
      goToEditMode={goToEditMode}
    />
  );
}
