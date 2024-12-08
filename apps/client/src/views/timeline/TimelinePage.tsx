import { useMemo } from 'react';
import { MaybeString, OntimeEvent, ProjectData, Runtime, Settings } from 'ontime-types';

import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { formatDuration, formatTime, getDefaultFormat, getTimeToStart } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { useTranslation } from '../../translation/TranslationProvider';

import Section from './timeline-section/TimelineSection';
import Timeline from './Timeline';
import { getTimelineOptions } from './timeline.options';
import { getUpcomingEvents, useScopedRundown } from './timeline.utils';

import './TimelinePage.scss';

interface TimelinePageProps {
  backstageEvents: OntimeEvent[];
  general: ProjectData;
  runtime: Runtime;
  selectedId: MaybeString;
  settings: Settings | undefined;
  time: ViewExtendedTimer;
}

/**
 * since we inherit from viewPage
 * which refreshes at least once a second
 * There is little point splitting or memoising top level elements
 */
export default function TimelinePage(props: TimelinePageProps) {
  const { backstageEvents, general, runtime, selectedId, settings, time } = props;
  // holds copy of the rundown with only relevant events
  const { scopedRundown, firstStart, totalDuration } = useScopedRundown(backstageEvents, selectedId);
  const { getLocalizedString } = useTranslation();
  const clock = formatTime(time.clock);

  const { now, next, followedBy } = useMemo(() => {
    return getUpcomingEvents(scopedRundown, selectedId);
  }, [scopedRundown, selectedId]);

  useWindowTitle('Timeline');

  // populate options
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const progressOptions = getTimelineOptions(defaultFormat);

  const titleNow = now?.title ?? '-';
  const dueText = getLocalizedString('timeline.due').toUpperCase();
  const nextText = next !== null ? next.title : '-';
  const followedByText = followedBy !== null ? followedBy.title : '-';
  let nextStatus: string | undefined;
  let followedByStatus: string | undefined;

  if (next !== null) {
    const timeToStart = getTimeToStart(time.clock, next.timeStart, next?.delay ?? 0, runtime.offset ?? 0);
    if (timeToStart < 0) {
      nextStatus = dueText;
    } else {
      nextStatus = `T - ${formatDuration(timeToStart)}`;
    }
  }

  if (followedBy !== null) {
    const timeToStart = getTimeToStart(time.clock, followedBy.timeStart, followedBy?.delay ?? 0, runtime.offset ?? 0);
    if (timeToStart < 0) {
      followedByStatus = dueText;
    } else {
      followedByStatus = `T - ${formatDuration(timeToStart)}`;
    }
  }
  return (
    <div className='timeline' data-testid='timeline-view'>
      <ViewParamsEditor viewOptions={progressOptions} />
      <div className='project-header'>
        {general?.projectLogo && <ViewLogo name={general.projectLogo} className='logo' />}
        {general.title}
        <div className='clock-container'>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <SuperscriptTime time={clock} className='time' />
        </div>
      </div>

      <div className='title-grid'>
        <Section title={getLocalizedString('timeline.live')} content={titleNow} category='now' />
        <Section title={getLocalizedString('common.next')} status={nextStatus} content={nextText} category='next' />
        <Section
          title={getLocalizedString('timeline.followedby')}
          status={followedByStatus}
          content={followedByText}
          category='next'
        />
      </div>
      <Timeline
        firstStart={firstStart}
        rundown={scopedRundown}
        selectedEventId={selectedId}
        totalDuration={totalDuration}
      />
    </div>
  );
}
