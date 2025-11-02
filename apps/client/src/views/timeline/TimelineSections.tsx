import { OntimeEvent } from 'ontime-types';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { useExpectedStartData } from '../../common/hooks/useSocket';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { formatDuration, getExpectedTimesFromExtendedEvent } from '../../common/utils/time';
import { useTranslation } from '../../translation/TranslationProvider';

import TimelineSection from './timeline-section/TimelineSection';

interface TimelineSectionsProps {
  now: ExtendedEntry<OntimeEvent> | null;
  next: ExtendedEntry<OntimeEvent> | null;
  followedBy: ExtendedEntry<OntimeEvent> | null;
}

export default function TimelineSections({ now, next, followedBy }: TimelineSectionsProps) {
  const { getLocalizedString } = useTranslation();
  const state = useExpectedStartData();

  // gather card data
  const titleNow = now?.title ?? '-';
  const dueText = getLocalizedString('timeline.due').toUpperCase();
  const nextText = next !== null ? next.title : '-';
  const followedByText = followedBy !== null ? followedBy.title : '-';
  let nextStatus: string | undefined;
  let followedByStatus: string | undefined;

  if (next !== null) {
    const { timeToStart } = getExpectedTimesFromExtendedEvent(next, state);
    if (timeToStart <= 0) {
      nextStatus = dueText;
    } else {
      nextStatus = formatDuration(timeToStart, timeToStart > MILLIS_PER_MINUTE * 10);
    }
  }

  if (followedBy !== null) {
    const { timeToStart } = getExpectedTimesFromExtendedEvent(followedBy, state);
    if (timeToStart <= 0) {
      followedByStatus = dueText;
    } else {
      followedByStatus = formatDuration(timeToStart, timeToStart > MILLIS_PER_MINUTE * 10);
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
        category='followedBy'
      />
    </div>
  );
}
