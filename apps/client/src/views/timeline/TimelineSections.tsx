import { OntimeEvent } from 'ontime-types';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { useLoadedRundown } from '../../common/hooks-query/useLoadedRundown';
import { useExpectedStartData } from '../../common/hooks/useSocket';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { formatDuration, getExpectedTimesFromExtendedEvent } from '../../common/utils/time';
import { useTranslation } from '../../translation/TranslationProvider';
import { getPropertyValue } from '../common/viewUtils';
import TimelineSection from './timeline-section/TimelineSection';

interface TimelineSectionsProps {
  now: ExtendedEntry<OntimeEvent> | null;
  next: ExtendedEntry<OntimeEvent> | null;
  followedBy: ExtendedEntry<OntimeEvent> | null;
  mainSource: keyof OntimeEvent | null;
  secondarySource: keyof OntimeEvent | null | 'none';
}

export default function TimelineSections({
  now,
  next,
  followedBy,
  mainSource,
  secondarySource,
}: TimelineSectionsProps) {
  const { getLocalizedString } = useTranslation();
  const state = useExpectedStartData();
  const { data: rundown } = useLoadedRundown();

  // gather card data
  const titleNow = now ? (getPropertyValue(now, mainSource ?? 'title') ?? '-') : getLocalizedString('timeline.standby');
  const dueText = getLocalizedString('timeline.due').toUpperCase();
  const nextText = getPropertyValue(next, mainSource ?? 'title') ?? '-';
  const followedByText = getPropertyValue(followedBy, mainSource ?? 'title') ?? '-';
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
      <TimelineSection
        title={getLocalizedString('timeline.live')}
        content={titleNow}
        secondary={getPropertyValue(now, secondarySource, rundown.entries)}
        category='now'
      />
      <TimelineSection
        title={getLocalizedString('common.next')}
        status={nextStatus}
        content={nextText}
        secondary={getPropertyValue(next, secondarySource, rundown.entries)}
        category='next'
      />
      <TimelineSection
        title={getLocalizedString('timeline.followedby')}
        status={followedByStatus}
        content={followedByText}
        secondary={getPropertyValue(followedBy, secondarySource, rundown.entries)}
        category='followedBy'
      />
    </div>
  );
}
