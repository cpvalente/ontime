import {
  CustomFields,
  EntryId,
  MaybeNumber,
  MaybeString,
  OntimeEntry,
  OntimeEvent,
  OntimeGroup,
  OntimeMilestone,
  isOntimeDelay,
  isOntimeEvent,
} from 'ontime-types';
import { useCallback, useMemo } from 'react';

import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { useFlatRundown } from '../../../common/hooks-query/useRundown';
import { useSelectAndRevealEntry } from '../../../features/rundown/useSelectAndRevealEntry';

/** How many results we render, the total number of matches is reported separately */
const maxResults = 50;
/** Notes can hold a whole script, we only show enough to explain the match */
const excerptPadding = 40;

const indexFilter = 'index';

/** Everything except delays, which carry no text to search */
type SearchableEntry = OntimeEvent | OntimeGroup | OntimeMilestone;

type FinderFilter = { key: string; label: string };

/**
 * Offered to the user as filter badges. Index is a positional lookup rather than a
 * text field, so it is handled separately from the fields a search runs over.
 */
const staticFilters: FinderFilter[] = [
  { key: indexFilter, label: 'Index' },
  { key: 'cue', label: 'Cue' },
  { key: 'title', label: 'Title' },
  { key: 'note', label: 'Note' },
];

/** Why an entry matched, so the UI can show the user */
type FinderMatch = { key: string; label: string; excerpt: string };

export type FinderResult = {
  id: EntryId;
  /** position in the flat rundown, which is how the rundown reveals an entry */
  index: number;
  /** 1-based position among events, null for groups and milestones */
  eventIndex: MaybeNumber;
  title: string;
  /** groups have no cue */
  cue: string;
  colour: string;
  parent: MaybeString;
  /** absent when the entry was found by index rather than by matching text */
  match: FinderMatch | null;
};

type SearchOutcome = { results: FinderResult[]; error: MaybeString; total: number };

const noResults: SearchOutcome = { results: [], error: null, total: 0 };

/** Groups are the only searchable entry with neither a cue nor a parent */
function toResult(entry: SearchableEntry, index: number, eventIndex: MaybeNumber, match: FinderMatch | null) {
  return {
    id: entry.id,
    index,
    eventIndex,
    title: entry.title,
    cue: 'cue' in entry ? entry.cue : '',
    colour: entry.colour,
    parent: 'parent' in entry ? entry.parent : null,
    match,
  } satisfies FinderResult;
}

/** Shows enough of a long value for the user to see why it matched */
function makeExcerpt(value: string, matchIndex: number, searchLength: number): string {
  const start = Math.max(0, matchIndex - excerptPadding);
  const end = Math.min(value.length, matchIndex + searchLength + excerptPadding);
  return `${start > 0 ? '…' : ''}${value.slice(start, end)}${end < value.length ? '…' : ''}`;
}

/**
 * The first field of an entry to contain the search string, if any.
 * Fields are tried in the order we prefer to report a match.
 */
function findMatch(
  entry: SearchableEntry,
  customFields: CustomFields,
  filterKey: MaybeString,
  searchString: string,
): FinderMatch | null {
  function check(key: string, label: string, value: string): FinderMatch | null {
    if (!value || (filterKey !== null && key !== filterKey)) {
      return null;
    }
    const matchIndex = value.toLowerCase().indexOf(searchString);
    if (matchIndex === -1) {
      return null;
    }
    return { key, label, excerpt: makeExcerpt(value, matchIndex, searchString.length) };
  }

  // groups have no cue, the rest is common to every searchable entry
  const fromCue = 'cue' in entry ? check('cue', 'Cue', entry.cue) : null;
  const match = fromCue ?? check('title', 'Title', entry.title) ?? check('note', 'Note', entry.note);
  if (match !== null) {
    return match;
  }

  // custom fields are named by the project, so these can only be reached generically
  for (const [key, value] of Object.entries(entry.custom)) {
    const definition = customFields[key];
    if (definition?.type !== 'text') {
      continue;
    }
    const custom = check(key, definition.label || key, value);
    if (custom) return custom;
  }

  return null;
}

/**
 * Splits the raw search value into an optional field filter and the text to look for.
 * Both `cue 12` and `cue:12` are accepted so that typing agrees with the filter badges.
 */
export function parseQuery(searchValue: string, filters: FinderFilter[]) {
  for (const filter of filters) {
    // the search value is already lowercased, custom field keys are not
    const prefix = filter.key.toLowerCase();
    if (searchValue === prefix) {
      return { filterKey: filter.key, searchString: '' };
    }
    if (searchValue.startsWith(`${prefix} `) || searchValue.startsWith(`${prefix}:`)) {
      return { filterKey: filter.key, searchString: searchValue.slice(prefix.length + 1).trim() };
    }
  }
  return { filterKey: null, searchString: searchValue };
}

/** Finds the single event at a 1-based position in the rundown */
export function searchByIndex(data: OntimeEntry[], indexString: string): SearchOutcome {
  const target = Number(indexString);
  if (isNaN(target) || target < 1) {
    return { ...noResults, error: 'Invalid index' };
  }

  let eventIndex = 0;
  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    if (!isOntimeEvent(entry)) {
      continue;
    }
    eventIndex++;
    if (eventIndex === target) {
      return { results: [toResult(entry, i, eventIndex, null)], error: null, total: 1 };
    }
  }

  return noResults;
}

/**
 * Matches entries on a single field when one is selected, otherwise on every text field.
 * Results keep rundown order, which keeps them predictable during a show.
 */
export function searchByText(
  data: OntimeEntry[],
  customFields: CustomFields,
  filterKey: MaybeString,
  searchString: string,
): SearchOutcome {
  const results: FinderResult[] = [];
  let total = 0;
  // indexes exposed to the UI are 1-based
  let eventIndex = 0;

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    if (isOntimeDelay(entry)) {
      continue;
    }
    const isEvent = isOntimeEvent(entry);
    if (isEvent) {
      eventIndex++;
    }

    const match = findMatch(entry, customFields, filterKey, searchString);
    if (match === null) {
      continue;
    }

    total++;
    if (results.length < maxResults) {
      results.push(toResult(entry, i, isEvent ? eventIndex : null, match));
    }
  }

  return { results, error: null, total };
}

/**
 * @param searchValue - the text the user is looking for
 * @param activeFilter - a field selected from the filter badges, if any
 */
export default function useFinder(searchValue: string, activeFilter: MaybeString) {
  const { data } = useFlatRundown();
  const { data: customFields } = useCustomFields();

  const selectAndRevealEntry = useSelectAndRevealEntry();

  /** The filters offered to the user: the fixed fields plus whatever the project defines */
  const filters = useMemo<FinderFilter[]>(() => {
    const customFilters = Object.entries(customFields)
      .filter(([_key, field]) => field.type === 'text')
      .map(([key, field]) => ({ key, label: field.label || key }));
    return [...staticFilters, ...customFilters];
  }, [customFields]);

  const { results, error, total, appliedFilter } = useMemo(() => {
    if (data.length === 0) {
      return { ...noResults, error: 'No data', appliedFilter: activeFilter };
    }

    const normalised = searchValue.trim().toLowerCase();
    if (normalised === '') {
      return { ...noResults, appliedFilter: activeFilter };
    }

    /**
     * If a badge is selected it scopes the search; otherwise, keyword prefixes in the input
     * (e.g. "cue:" / "title:") are parsed and the matching badge is highlighted.
     */
    const { filterKey, searchString } = activeFilter
      ? { filterKey: activeFilter, searchString: normalised }
      : parseQuery(normalised, filters);

    if (filterKey === indexFilter) {
      return { ...searchByIndex(data, searchString), appliedFilter: filterKey };
    }
    if (searchString === '') {
      // a filter is selected, but there is nothing to match on yet
      return { ...noResults, appliedFilter: filterKey };
    }
    return { ...searchByText(data, customFields, filterKey, searchString), appliedFilter: filterKey };
  }, [data, customFields, filters, searchValue, activeFilter]);

  const select = useCallback(
    (result: FinderResult) => {
      selectAndRevealEntry({ id: result.id, index: result.index, parent: result.parent });
    },
    [selectAndRevealEntry],
  );

  return { select, results, error, total, filters, appliedFilter };
}
