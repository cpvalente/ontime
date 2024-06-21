import { MaybeString, OntimeEvent, ProjectData, Settings } from 'ontime-types';

import { getProgressOptions } from '../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { cx } from '../../common/utils/styleUtils';
import { formatTime, getDefaultFormat } from '../../common/utils/time';

import Timeline from './Timeline/Timeline';
import { getUpcomingEvents } from './Timeline/timelineUtils';

import style from './TimelinePage.module.scss';

interface TimelinePageProps {
  backstageEvents: OntimeEvent[];
  general: ProjectData;
  selectedId: MaybeString;
  settings: Settings | undefined;
  time: ViewExtendedTimer;
}

export default function TimelinePage(props: TimelinePageProps) {
  const { backstageEvents, general, selectedId, settings, time } = props;

  const clock = formatTime(time.clock);
  const { now, next, followedBy } = getUpcomingEvents(backstageEvents, selectedId);

  // populate options
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const progressOptions = getProgressOptions(defaultFormat);

  return (
    <div className={style.progress}>
      <ViewParamsEditor paramFields={progressOptions} />
      <div className={style.title}>{general.title}</div>
      <div className={style.sections}>
        <Section title='Time now' content={clock} category='now' />
        <Section title='Next' content={next} category='next' />
        <Section title='Current' content={now} category='now' />
        <Section title='Followed by' content={followedBy} category='next' />
      </div>
      <Timeline selectedEventId={selectedId} />
    </div>
  );
}

interface SectionProps {
  category: 'now' | 'next';
  content: MaybeString;
  title: string;
}

function Section(props: SectionProps) {
  const { category, content, title } = props;

  const contentClasses = cx([style.sectionContent, content != null ? style[category] : style.subdue]);
  return (
    <div>
      <div className={style.sectionTitle}>{title}</div>
      <div className={contentClasses}>{content ?? '-'}</div>
    </div>
  );
}
