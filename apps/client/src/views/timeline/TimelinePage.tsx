import { useMemo } from 'react';
import { OntimeView } from 'ontime-types';

import EmptyPage from '../../common/components/state/EmptyPage';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useClock, useSelectedEventId } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import { useTranslation } from '../../translation/TranslationProvider';
import Loader from '../common/loader/Loader';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';

import Timeline from './Timeline';
import { getTimelineOptions } from './timeline.options';
import { getUpcomingEvents, useScopedRundown } from './timeline.utils';
import TimelineSections from './TimelineSections';
import { TimelineData, useTimelineData } from './useTimelineData';

import './TimelinePage.scss';

export default function TimelinePageLoader() {
  const { data, status } = useTimelineData();

  useWindowTitle('Timeline');

  if (status === 'pending') {
    return <Loader />;
  }

  if (status === 'error') {
    return <EmptyPage text='There was an error fetching data, please refresh the page.' />;
  }

  return <TimelinePage {...data} />;
}

function TimelinePage({ events, projectData, settings }: TimelineData) {
  const selectedEventId = useSelectedEventId();
  // holds copy of the rundown with only relevant events
  const { scopedRundown, firstStart, totalDuration } = useScopedRundown(events, selectedEventId);

  // gather card options
  const { now, next, followedBy } = useMemo(() => {
    return getUpcomingEvents(scopedRundown, selectedEventId);
  }, [scopedRundown, selectedEventId]);

  // populate options
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const progressOptions = useMemo(() => getTimelineOptions(defaultFormat), [defaultFormat]);

  return (
    <div className='timeline' data-testid='timeline-view'>
      <ViewParamsEditor target={OntimeView.Timeline} viewOptions={progressOptions} />
      <div className='project-header'>
        {projectData?.logo && <ViewLogo name={projectData.logo} className='logo' />}
        <div className='title'>{projectData.title}</div>
        <TimelineClock />
      </div>

      <TimelineSections now={now} next={next} followedBy={followedBy} />

      <Timeline
        firstStart={firstStart}
        rundown={scopedRundown}
        selectedEventId={selectedEventId}
        totalDuration={totalDuration}
      />
    </div>
  );
}

function TimelineClock() {
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
