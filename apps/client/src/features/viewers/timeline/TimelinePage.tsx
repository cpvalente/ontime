import { useMemo } from 'react';
import { MaybeString, OntimeEvent, ProjectData, Settings } from 'ontime-types';

import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';

import Section from './timeline-section/TimelineSection';
import Timeline from './Timeline';
import { getTimelineOptions } from './timeline.options';
import { getFormattedTimeToStart, getScopedRundown, getUpcomingEvents } from './timeline.utils';

import style from './TimelinePage.module.scss';

interface TimelinePageProps {
  backstageEvents: OntimeEvent[];
  general: ProjectData;
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
  const { backstageEvents, general, selectedId, settings, time } = props;

  const { getLocalizedString } = useTranslation();
  const clock = formatTime(time.clock);

  const scopedRundown = useMemo(() => {
    return getScopedRundown(backstageEvents, selectedId);
  }, [backstageEvents, selectedId]);

  const { now, next, followedBy } = useMemo(() => {
    return getUpcomingEvents(scopedRundown, selectedId);
  }, [scopedRundown, selectedId]);

  // populate options
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const progressOptions = getTimelineOptions(defaultFormat);

  const titleNow = now?.title ?? '-';
  const dueText = getLocalizedString('timeline.due');
  const nextText = next !== null ? `${next.title} · ${getFormattedTimeToStart(next, time.clock, dueText)}` : '-';
  const followedByText =
    followedBy !== null ? `${followedBy.title} · ${getFormattedTimeToStart(followedBy, time.clock, dueText)}` : '-';

  return (
    <div className={style.timeline}>
      <ViewParamsEditor viewOptions={progressOptions} />
      <div className={style.title}>{general.title}</div>
      <div className={style.sections}>
        <Section title={getLocalizedString('common.time_now')} content={clock} category='now' />
        <Section title={getLocalizedString('common.next')} content={nextText} category='next' />
        <Section title={getLocalizedString('timeline.live')} content={titleNow} category='now' />
        <Section title={getLocalizedString('timeline.followedby')} content={followedByText} category='next' />
      </div>
      <Timeline selectedEventId={selectedId} rundown={scopedRundown} />
    </div>
  );
}
