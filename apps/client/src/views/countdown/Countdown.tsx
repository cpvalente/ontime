import { useState } from 'react';
import { IoAdd, IoSaveOutline } from 'react-icons/io5';
import { EntryId, isOntimeEvent, OntimeEvent, ProjectData, Settings } from 'ontime-types';

import Button from '../../common/components/buttons/Button';
import Empty from '../../common/components/state/Empty';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useFadeOutOnInactivity } from '../../common/hooks/useFadeOutOnInactivity';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { useTranslation } from '../../translation/TranslationProvider';

import { getCountdownOptions, useCountdownOptions } from './countdown.options';
import CountdownList from './CountdownList';
import CountdownSelect from './CountdownSelect';

import './Countdown.scss';

interface CountdownProps {
  backstageEvents: OntimeEvent[];
  general: ProjectData;
  time: ViewExtendedTimer;
  isMirrored: boolean;
  settings: Settings | undefined;
}

export default function Countdown(props: CountdownProps) {
  const { backstageEvents, general, time, isMirrored, settings } = props;

  const { getLocalizedString } = useTranslation();
  const { secondarySource, subscriptions } = useCountdownOptions();
  const showEditButtons = useFadeOutOnInactivity();
  const [editMode, setEditMode] = useState(false);

  useWindowTitle('Backstage');

  const addEvent = (eventId: EntryId) => {};
  const removeEvent = (eventId: EntryId) => {};

  // gather rundown data
  const filteredEvents = backstageEvents.filter(isOntimeEvent);

  // gather timer data
  const clock = formatTime(time.clock);

  // gather presentation data
  const hasEvents = filteredEvents.length > 0;

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const countdownOptions = getCountdownOptions(defaultFormat);

  return (
    <div className={`countdown ${isMirrored ? 'mirror' : ''}`} data-testid='backstage-view'>
      <ViewParamsEditor viewOptions={countdownOptions} />
      <div className='project-header'>
        {general?.projectLogo ? <ViewLogo name={general.projectLogo} className='logo' /> : <div className='logo' />}
        <div className='title'>{general.title}</div>
        <div className='clock-container'>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <SuperscriptTime time={clock} className='time' />
        </div>
      </div>

      <Button variant='primary' className='fab-edit' disabled={!hasEvents} onClick={() => setEditMode(!editMode)}>
        {editMode ? (
          <>
            <IoAdd /> Edit
          </>
        ) : (
          <>
            <IoSaveOutline /> Save
          </>
        )}
      </Button>

      <div className='list-container'>
        {/**
         * TODO: countdown-container is scroll container
         */}
        {!hasEvents && <Empty text={getLocalizedString('common.no_data')} className='empty-container' />}

        {editMode ? (
          <CountdownSelect events={filteredEvents} subscriptions={subscriptions} />
        ) : (
          <CountdownList subscriptions={subscriptions} />
        )}
      </div>
    </div>
  );
}
