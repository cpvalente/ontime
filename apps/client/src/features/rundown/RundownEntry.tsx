import { isOntimeDelay, isOntimeEvent, isOntimeMilestone, OntimeEntry, Playback, SupportedEntry } from 'ontime-types';

import RundownDelay from './rundown-delay/RundownDelay';
import RundownEvent from './rundown-event/RundownEvent';
import RundownMilestone from './rundown-milestone/RundownMilestone';

interface RundownEntryProps {
  type: SupportedEntry;
  isPast: boolean;
  data: OntimeEntry;
  loaded: boolean;
  eventIndex: number;
  hasCursor: boolean;
  isNext: boolean;
  isNextDay: boolean;
  playback?: Playback; // we only care about this if this event is playing
  isRolling: boolean; // we need to know even if not related to this event
  totalGap: number;
  isLinkedToLoaded: boolean;
}

export default function RundownEntry({
  isPast,
  data,
  loaded,
  hasCursor,
  isNext,
  playback,
  isRolling,
  eventIndex,
  isNextDay,
  totalGap,
  isLinkedToLoaded,
}: RundownEntryProps) {
  'use memo';

  if (isOntimeEvent(data)) {
    return (
      <RundownEvent
        eventId={data.id}
        eventIndex={eventIndex}
        cue={data.cue}
        timeStart={data.timeStart}
        timeEnd={data.timeEnd}
        duration={data.duration}
        timeStrategy={data.timeStrategy}
        linkStart={data.linkStart}
        flag={data.flag}
        countToEnd={data.countToEnd}
        endAction={data.endAction}
        timerType={data.timerType}
        title={data.title}
        note={data.note}
        delay={data.delay}
        colour={data.colour}
        isPast={isPast}
        isNext={isNext}
        skip={data.skip}
        parent={data.parent}
        loaded={loaded}
        hasCursor={hasCursor}
        playback={playback}
        isRolling={isRolling}
        gap={data.gap}
        isNextDay={isNextDay}
        dayOffset={data.dayOffset}
        totalGap={totalGap}
        isLinkedToLoaded={isLinkedToLoaded}
        hasTriggers={data.triggers.length > 0}
      />
    );
  } else if (isOntimeDelay(data)) {
    return <RundownDelay data={data} hasCursor={hasCursor} />;
  } else if (isOntimeMilestone(data)) {
    return (
      <RundownMilestone
        colour={data.colour}
        cue={data.cue}
        entryId={data.id}
        hasCursor={hasCursor}
        title={data.title}
      />
    );
  }
  return null;
}
