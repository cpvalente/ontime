import { OntimeEvent, isOntimeEvent } from 'ontime-types';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import ScrollArea from '../../../common/components/scroll-area/ScrollArea';
import useRundown from '../../../common/hooks-query/useRundown';
import { useSelectedEventId } from '../../../common/hooks/useSocket';
import { ExtendedEntry, getFlatRundownMetadata } from '../../../common/utils/rundownMetadata';
import { useEventSelection } from '../../../features/rundown/useEventSelection';
import { useSelectAndRevealEntry } from '../../../features/rundown/useSelectAndRevealEntry';
import { AppMode } from '../../../ontimeConfig';
import { getCurrentEventInfo } from './titleList.utils';
import TitleListEmpty from './TitleListEmpty';
import TitleListItem from './TitleListItem';

import style from './TitleList.module.scss';

interface TitleListProps {
  mode: AppMode;
}

export default function TitleList({ mode }: TitleListProps) {
  const { data: rundown } = useRundown();
  const selectedEventId = useSelectedEventId();
  const cursor = useEventSelection((state) => state.cursor);

  // In Run mode, follow the currently playing event
  // In Edit mode, follow the user's selection
  const resolvedFollowEventId = useMemo(() => {
    return mode === AppMode.Run ? selectedEventId : cursor;
  }, [mode, selectedEventId, cursor]);

  // Filter and memoize event-only data
  const eventData = useMemo(() => {
    const flatData = getFlatRundownMetadata(rundown, resolvedFollowEventId);
    return flatData.filter(isOntimeEvent) as ExtendedEntry<OntimeEvent>[];
  }, [rundown, resolvedFollowEventId]);

  if (eventData.length === 0) {
    return <TitleListEmpty />;
  }

  return (
    <TitleListContent
      mode={mode}
      eventData={eventData}
      selectedEventId={selectedEventId}
      resolvedFollowEventId={resolvedFollowEventId}
      rundownId={rundown.id}
    />
  );
}

interface TitleListContentProps {
  mode: AppMode;
  eventData: ExtendedEntry<OntimeEvent>[];
  selectedEventId: string | null;
  resolvedFollowEventId: string | null;
  rundownId: string;
}

function TitleListContent({
  mode,
  eventData,
  selectedEventId,
  resolvedFollowEventId,
  rundownId,
}: TitleListContentProps) {
  'use memo';

  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const scrollParentRef = useRef<HTMLDivElement | null>(null);
  const selectAndRevealEntry = useSelectAndRevealEntry(rundownId);

  // Calculate current event info
  const currentEventInfo = useMemo(() => {
    return getCurrentEventInfo(eventData);
  }, [eventData]);

  const followIndex = useMemo(() => {
    if (!resolvedFollowEventId) return -1;
    return eventData.findIndex((entry) => entry.id === resolvedFollowEventId);
  }, [eventData, resolvedFollowEventId]);

  // Stable selection handler
  const handleSelect = useCallback(
    (params: { id: string; index: number; parent?: string }) => {
      selectAndRevealEntry(params);
    },
    [selectAndRevealEntry],
  );

  // Auto-scroll to keep current item at sticky position using Virtuoso
  useEffect(() => {
    if (!virtuosoRef.current) return;

    const indexToFollow = followIndex !== -1 ? followIndex : currentEventInfo.index;
    if (indexToFollow === -1) return;

    // In Run mode, always scroll to follow
    // In Edit mode, only scroll if beyond sticky position (3)
    if (mode === AppMode.Edit && indexToFollow <= 3) return;

    virtuosoRef.current.scrollToIndex({
      index: indexToFollow,
      align: 'start',
      behavior: 'smooth',
      offset: -50,
    });
  }, [currentEventInfo.index, followIndex, mode]);

  // Virtuoso item renderer
  const itemContent = useCallback(
    (index: number, entry: ExtendedEntry<OntimeEvent>) => {
      const nextEntry = eventData[index + 1];
      const isGroupEnd = Boolean(entry.parent) && entry.parent !== (nextEntry?.parent ?? null);
      return (
        <TitleListItem
          key={entry.id}
          entry={entry}
          currentEventIndex={currentEventInfo.eventIndex}
          upcomingChipLimit={currentEventInfo.upcomingChipLimit}
          isRunning={mode === AppMode.Run && selectedEventId !== null}
          mode={mode}
          onSelect={handleSelect}
          isGroupEnd={isGroupEnd}
        />
      );
    },
    [eventData, currentEventInfo.eventIndex, currentEventInfo.upcomingChipLimit, mode, selectedEventId, handleSelect],
  );

  return (
    <ScrollArea className={style.container} ref={scrollParentRef}>
      <Virtuoso
        ref={virtuosoRef}
        data={eventData}
        computeItemKey={(_index, entry) => entry.id}
        itemContent={itemContent}
        increaseViewportBy={{ top: 200, bottom: 200 }}
        customScrollParent={scrollParentRef.current ?? undefined}
        components={{
          List: VirtuosoListComponent,
          Footer: TitleListFooter,
        }}
      />
    </ScrollArea>
  );
}

// Virtuoso list component - extracted to prevent recreation on every render
function VirtuosoListComponent({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul {...props} className={style.list}>
      {children}
    </ul>
  );
}
VirtuosoListComponent.displayName = 'VirtuosoListComponent';

function TitleListFooter() {
  return <div className={style.bottomSpacer} />;
}
