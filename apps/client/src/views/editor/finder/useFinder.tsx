import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useSessionStorage } from '@mantine/hooks';
import { EntryId, isOntimeEvent, isOntimeGroup, isOntimeMilestone, MaybeString, SupportedEntry } from 'ontime-types';

import { useFlatRundown } from '../../../common/hooks-query/useRundown';
import { useEventSelection } from '../../../features/rundown/useEventSelection';

const maxResults = 12;

type FilterableGroup = {
  type: SupportedEntry.Group;
  id: EntryId;
  index: number;
  title: string;
  colour: string;
};

type FilterableEvent = {
  type: SupportedEntry.Event;
  id: EntryId;
  index: number;
  eventIndex: number;
  title: string;
  cue: string;
  colour: string;
  parent: MaybeString;
};

type FilterableMilestone = {
  type: SupportedEntry.Milestone;
  id: EntryId;
  index: number;
  title: string;
  cue: string;
  colour: string;
  parent: MaybeString;
};

type FilterableEntry = FilterableGroup | FilterableEvent | FilterableMilestone;

export default function useFinder() {
  const { data, rundownId } = useFlatRundown();
  const [results, setResults] = useState<FilterableEntry[]>([]);
  const [error, setError] = useState<MaybeString>(null);
  const lastSearchString = useRef('');

  const setSelectedEvents = useEventSelection((state) => state.setSelectedEvents);
  const scrollToEntry = useEventSelection((state) => state.scrollToEntry);

  const [collapsedGroups, setCollapsedGroups] = useSessionStorage<EntryId[]>({
    // we ensure that this is unique to the rundown
    key: `rundown.${rundownId}-editor-collapsed-groups`,
    defaultValue: [],
  });

  /** Filters the rundown to a given evaluation */
  const find = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!data || data.length === 0) {
        setError('No data');
        return;
      }
      setError(null);

      if (event.target.value === '') {
        setResults([]);
        return;
      }

      const searchValue = event.target.value.toLowerCase();
      lastSearchString.current = searchValue;

      if (searchValue.startsWith('index ')) {
        const searchString = searchValue.slice('index '.length).trim();
        const { results, error } = searchByIndex(searchString);
        setResults(results);
        setError(error);
        return;
      }

      if (searchValue.startsWith('cue ')) {
        const searchString = searchValue.slice('cue '.length).trim();
        const { results, error } = searchByCue(searchString);
        setResults(results);
        setError(error);
        return;
      }

      const searchString = searchValue.startsWith('title ') ? searchValue.slice('title '.length).trim() : searchValue;
      const { results, error } = searchByTitle(searchString);
      setResults(results);
      setError(error);

      /** Returns a single item with a matching index */
      function searchByIndex(searchString: string) {
        const searchIndex = Number(searchString);
        if (isNaN(searchIndex) || searchIndex < 1) {
          return { results: [], error: 'Invalid index' };
        }

        if (searchIndex > data.length) {
          return { results: [], error: null };
        }

        // indexes exposed to the UI are 1-based
        let eventIndex = 1;
        const results: FilterableEvent[] = [];
        for (let i = 0; i < data.length; i++) {
          const event = data[i];
          if (isOntimeEvent(event)) {
            if (eventIndex === searchIndex) {
              results.push({
                type: SupportedEntry.Event,
                id: event.id,
                index: i,
                eventIndex,
                title: event.title,
                cue: event.cue,
                colour: event.colour,
                parent: event.parent,
              } satisfies FilterableEvent);
              break;
            }
            eventIndex++;
          }
        }

        return { results, error: null };
      }

      /** Returns maxResults of OntimeEvents that match the cue field */
      function searchByCue(searchString: string) {
        // indexes exposed to the UI are 1-based
        let eventIndex = 1;
        // limit amount of results we show
        let remaining = maxResults;
        const results: FilterableEvent[] = [];

        for (let i = 0; i < data.length; i++) {
          if (remaining <= 0) {
            break;
          }
          const event = data[i];
          if (isOntimeEvent(event)) {
            if (event.cue.toLowerCase().includes(searchString)) {
              remaining--;
              results.push({
                type: SupportedEntry.Event,
                id: event.id,
                index: i,
                eventIndex,
                title: event.title,
                cue: event.cue,
                colour: event.colour,
                parent: event.parent,
              } satisfies FilterableEvent);
            }
            eventIndex++;
          }
        }
        return { results, error: null };
      }

      /** Returns maxResults of OntimeEvents that match the title field*/
      function searchByTitle(searchString: string) {
        // indexes exposed to the UI are 1-based
        let eventIndex = 1;
        // limit amount of results we show
        let remaining = maxResults;
        const results: FilterableEntry[] = [];

        for (let i = 0; i < data.length; i++) {
          if (remaining <= 0) {
            break;
          }

          const entry = data[i];
          if (isOntimeEvent(entry)) {
            if (entry.title.toLowerCase().includes(searchString)) {
              remaining--;
              results.push({
                type: SupportedEntry.Event,
                id: entry.id,
                index: i,
                eventIndex,
                title: entry.title,
                cue: entry.cue,
                colour: entry.colour,
                parent: entry.parent,
              } satisfies FilterableEvent);
            }
            eventIndex++;
          } else if (isOntimeGroup(entry)) {
            if (entry.title.toLowerCase().includes(searchString)) {
              remaining--;
              results.push({
                type: SupportedEntry.Group,
                id: entry.id,
                index: i,
                title: entry.title,
                colour: entry.colour,
              } satisfies FilterableGroup);
            }
          } else if (isOntimeMilestone(entry)) {
            if (entry.title.toLowerCase().includes(searchString)) {
              remaining--;
              results.push({
                type: SupportedEntry.Milestone,
                id: entry.id,
                index: i,
                title: entry.title,
                cue: entry.cue,
                colour: entry.colour,
                parent: entry.parent,
              } satisfies FilterableMilestone);
            }
          }
        }
        return { results, error: null };
      }
    },
    [data],
  );

  const select = useCallback(
    (selectedEvent: FilterableEntry) => {
      // First expand the parent group if this is an event inside a group
      if ('parent' in selectedEvent && selectedEvent.parent !== null) {
        // Try direct state update instead of using callback
        const currentGroups = [...new Set(collapsedGroups)];
        const newGroups = currentGroups.filter((id) => id !== selectedEvent.parent);
        // Force a direct update
        setCollapsedGroups(newGroups);
      }

      // Then select the event
      setSelectedEvents({ id: selectedEvent.id, index: selectedEvent.index, selectMode: 'click' });
      scrollToEntry(selectedEvent.id);
    },
    [collapsedGroups, setCollapsedGroups, setSelectedEvents, scrollToEntry],
  );

  /** clear results when source data changes */
  useEffect(() => {
    setResults([]);
    setError(null);
    // fake a submit event to re-run the search
    if (lastSearchString.current) {
      find({ target: { value: lastSearchString.current } } as ChangeEvent<HTMLInputElement>);
    }
  }, [data, find]);

  return { find, select, results, error };
}
