import { MaybeString } from 'ontime-types';
import { KeyboardEvent, useDeferredValue, useEffect, useRef, useState } from 'react';

import ToggleButton from '../../../common/components/buttons/ToggleButton';
import Input from '../../../common/components/input/input/Input';
import Kbd from '../../../common/components/kbd/Kbd';
import Modal from '../../../common/components/modal/Modal';
import { getAccessibleColour } from '../../../common/utils/styleUtils';
import useFinder, { FinderResult } from './useFinder';

import style from './Finder.module.scss';

interface FinderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Finder({ isOpen, onClose }: FinderProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MaybeString>(null);
  const [selectedId, setSelectedId] = useState<MaybeString>(null);

  /**
   * Keeps typing responsive while the list re-renders.
   * The search itself is cheap, rendering the results is what costs.
   */
  const deferredSearch = useDeferredValue(search);
  const { select, results, error, total, filters, appliedFilter } = useFinder(deferredSearch, filter);

  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  /**
   * We track the selection by ID so that it survives the result list changing under us:
   * an entry that no longer exists falls back to the first result instead of dangling past the end
   */
  const activeIndex = Math.max(
    0,
    results.findIndex((entry) => entry.id === selectedId),
  );
  const activeEntry = results.at(activeIndex);

  /** keep the highlighted entry in view while navigating with the keyboard */
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeEntry?.id]);

  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    // pressing the search shortcut again selects the query, ready to be replaced
    if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
      event.preventDefault();
      inputRef.current?.select();
      return;
    }

    // all operations need results
    if (results.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      setSelectedId(results[(activeIndex + 1) % results.length].id);
    }
    if (event.key === 'ArrowUp') {
      setSelectedId(results[(activeIndex - 1 + results.length) % results.length].id);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      submit(activeEntry);
    }
  };

  const submit = (entry: FinderResult | undefined) => {
    if (!entry) {
      return;
    }
    select(entry);
    onClose();
  };

  /** Scopes the search to a single field, or back to all fields when tapped again */
  const handleFilter = (filterKey: string) => {
    setFilter((previous) => (previous === filterKey ? null : filterKey));
    inputRef.current?.focus();
  };

  const hiddenResults = total - results.length;

  return (
    <Modal
      title=''
      isOpen={isOpen}
      onClose={onClose}
      showBackdrop
      bodyElements={
        <div onKeyDown={navigate}>
          <Input
            ref={inputRef}
            height='large'
            fluid
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Search...'
          />
          <div className={style.filters} data-testid='finder-filters'>
            <span className={style.filterLabel}>Filter by</span>
            {filters.map((option) => (
              <ToggleButton
                key={option.key}
                pressed={appliedFilter === option.key}
                size='small'
                onClick={() => handleFilter(option.key)}
              >
                {option.label}
              </ToggleButton>
            ))}
          </div>
          <ul className={style.scrollContainer}>
            {error && <li className={style.error}>{error}</li>}
            {!error && results.length === 0 && <li className={style.empty}>No results</li>}
            {results.map((entry) => {
              const isSelected = activeEntry?.id === entry.id;
              // the title and cue are already on the row, a match anywhere else needs showing
              const showMatch = entry.match !== null && entry.match.key !== 'title' && entry.match.key !== 'cue';

              return (
                <li
                  key={entry.id}
                  ref={isSelected ? activeRef : undefined}
                  className={style.entry}
                  data-testid='finder-result'
                  data-selected={isSelected}
                  onClick={() => submit(entry)}
                  onPointerEnter={() => setSelectedId(entry.id)}
                >
                  <div className={style.data}>
                    <div className={style.index} style={getAccessibleColour(entry.colour)}>
                      {entry.eventIndex ?? '-'}
                    </div>
                    <div className={style.cue}>{entry.cue}</div>
                    <div className={style.title}>{entry.title}</div>
                    {showMatch && (
                      <div className={style.match} data-testid='finder-result-match'>
                        <span className={style.matchLabel}>{entry.match?.label}</span>
                        {entry.match?.excerpt}
                      </div>
                    )}
                  </div>
                  {isSelected && <span className={style.go}>Go ⏎</span>}
                </li>
              );
            })}
            {hiddenResults > 0 && (
              <li className={style.more} data-testid='finder-more'>
                {hiddenResults} more {hiddenResults === 1 ? 'result' : 'results'} — keep typing to narrow the search
              </li>
            )}
          </ul>
        </div>
      }
      footerElements={
        <div className={style.footer}>
          <div className={style.hints}>
            <span className={style.hintItem}>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              Navigate
            </span>
            <span className={style.hintItem}>
              <Kbd>Enter</Kbd>
              Go
            </span>
            <span className={style.hintItem}>
              <Kbd>Esc</Kbd>
              Close
            </span>
          </div>
          {total > 0 && (
            <div className={style.count} data-testid='finder-count'>
              {hiddenResults > 0 ? `Showing ${results.length} of ${total}` : `${total} result${total === 1 ? '' : 's'}`}
            </div>
          )}
        </div>
      }
    />
  );
}
