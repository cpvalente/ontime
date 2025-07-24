import { OntimeEvent } from 'ontime-types';

import { useTimelineSocket } from '../../common/hooks/useSocket';
import { formatDuration } from '../../common/utils/time';
import { useTranslation } from '../../translation/TranslationProvider';

import TimelineSection from './timeline-section/TimelineSection';
import { getTimeToStart } from './timeline.utils';

interface TimelineSectionsProps {
  now: OntimeEvent | null;
  next: OntimeEvent | null;
  followedBy: OntimeEvent | null;
}

export default function TimelineSections({ now, next, followedBy }: TimelineSectionsProps) {
  const { getLocalizedString } = useTranslation();
  const { clock, offset } = useTimelineSocket();

  // gather card data
  const titleNow = now?.title ?? '-';
  const dueText = getLocalizedString('timeline.due').toUpperCase();
  const nextText = next !== null ? next.title : '-';
  const followedByText = followedBy !== null ? followedBy.title : '-';
  let nextStatus: string | undefined;
  let followedByStatus: string | undefined;

  if (next !== null) {
    const timeToStart = getTimeToStart(clock, next.timeStart, next?.delay ?? 0, offset);
    if (timeToStart < 0) {
      nextStatus = dueText;
    } else {
      nextStatus = `T - ${formatDuration(timeToStart)}`;
    }
  }

  if (followedBy !== null) {
    const timeToStart = getTimeToStart(clock, followedBy.timeStart, followedBy?.delay ?? 0, offset);
    if (timeToStart < 0) {
      followedByStatus = dueText;
    } else {
      followedByStatus = `T - ${formatDuration(timeToStart)}`;
    }
  }

  return (
    <div className='title-grid'>
      <TimelineSection title={getLocalizedString('timeline.live')} content={titleNow} category='now' />
      <TimelineSection
        title={getLocalizedString('common.next')}
        status={nextStatus}
        content={nextText}
        category='next'
      />
      <TimelineSection
        title={getLocalizedString('timeline.followedby')}
        status={followedByStatus}
        content={followedByText}
        category='next'
      />
    </div>
  );
}
