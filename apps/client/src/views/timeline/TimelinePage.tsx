import { useMemo } from 'react';
import { MaybeString, OntimeEvent, ProjectData, Runtime, Settings } from 'ontime-types';
import { dayInMs, isPlaybackActive, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { formatDuration, formatTime, getDefaultFormat } from '../../common/utils/time';
import { calculateTimeUntilStart } from '../../common/utils/timeuntil';
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

  const playbackActive = isPlaybackActive(time.playback);

  // populate options
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const progressOptions = getTimelineOptions(defaultFormat);

  const titleNow = now?.title ?? '-';
  const dueText = getLocalizedString('timeline.due').toUpperCase();
  const nextText = next !== null ? next.title : '-';
  const followedByText = followedBy !== null ? followedBy.title : '-';
  let nextStatus: string | undefined;
  let followedByStatus: string | undefined;

  if (playbackActive && now && next !== null) {
    const timeToStart = calculateTimeUntilStart(
      next.timeStart + (next.dayOffset - now.dayOffset) * dayInMs,
      next.gap,
      next.linkStart !== null,
      time.clock,
      runtime.offset,
    );
    if (timeToStart < MILLIS_PER_SECOND) {
      nextStatus = dueText;
    } else {
      nextStatus = `T - ${formatDuration(timeToStart, timeToStart > 2 * MILLIS_PER_MINUTE)}`;
    }

    if (followedBy !== null) {
      const timeToStart = calculateTimeUntilStart(
        followedBy.timeStart + (followedBy.dayOffset - now.dayOffset) * dayInMs,
        followedBy.gap + next.gap,
        false,
        time.clock,
        runtime.offset,
      );
      if (timeToStart < MILLIS_PER_SECOND) {
        followedByStatus = dueText;
      } else {
        followedByStatus = `T - ${formatDuration(timeToStart, timeToStart > 2 * MILLIS_PER_MINUTE)}`;
      }
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
        nextEventId={next?.id ?? null}
        totalDuration={totalDuration}
      />
    </div>
  );
}
