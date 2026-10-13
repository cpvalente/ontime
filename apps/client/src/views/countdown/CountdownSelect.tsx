import { EntryId, OntimeEvent, OntimeGroup, isOntimeGroup } from 'ontime-types';
import { useState } from 'react';
import { IoArrowBack, IoClose, IoSaveOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router';

import Button from '../../common/components/buttons/Button';
import IconButton from '../../common/components/buttons/IconButton';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { cx } from '../../common/utils/styleUtils';
import { useTranslation } from '../../translation/TranslationProvider';
import ClockTime from '../common/clock-time/ClockTime';
import { makeSubscriptionsUrl } from './countdown.utils';

import './Countdown.scss';

interface CountdownSelectProps {
  events: ExtendedEntry<OntimeEvent | OntimeGroup>[];
  subscriptions: EntryId[];
  disableEdit: () => void;
}

export default function CountdownSelect({ events, subscriptions, disableEdit }: CountdownSelectProps) {
  const [selected, setSelected] = useState<EntryId[]>(subscriptions);
  const navigate = useNavigate();
  const { getLocalizedString } = useTranslation();

  /**
   * Toggles an entry from the selected set
   */
  const toggleSelect = (entryId: EntryId) => {
    setSelected((prev) => {
      if (prev.includes(entryId)) {
        // If the entry is already selected, remove it
        return prev.filter((id) => id !== entryId);
      }
      return [...prev, entryId];
    });
  };

  /**
   * Creates a URL with the selected subscriptions
   * and navigates to it
   */
  const applySelection = () => {
    // we remove events that no longer exist to avoid stale subscriptions
    const filteredSelected = selected.filter((id) => events.some((event) => event.id === id));
    const url = makeSubscriptionsUrl(window.location.href, filteredSelected);
    disableEdit();
    setSelected([]);
    navigate(url.search.toString());
  };

  // make a copy of the selected array for quick lookup
  const selectedIds = new Set(selected);

  return (
    <div className='list-container list-container--select'>
      {events.map((event) => {
        const title = event.title || getLocalizedString('countdown.no_title');
        const isSelected = selectedIds.has(event.id);
        const isGroup = isOntimeGroup(event);
        const isGroupedEvent = !isGroup && event.parent !== null && selectedIds.has(event.parent);

        return (
          <button
            key={event.id}
            type='button'
            onClick={() => toggleSelect(event.id)}
            aria-pressed={isSelected}
            className={cx([
              'sub',
              'sub--selectable',
              isSelected && 'sub--selected',
              !isGroup && event.skip && 'sub--skipped',
              isGroup && 'sub--group',
              isGroupedEvent && 'sub--in-group',
            ])}
          >
            <div
              className='sub__binder'
              style={{ '--user-color': event?.colour ?? '', '--group-color': event.groupColour ?? 'transparent' }}
            />
            <div className='sub__schedule'>
              <ClockTime value={event.timeStart} preferredFormat12='h:mm a' preferredFormat24='HH:mm' />
              →
              <ClockTime value={event.timeEnd} preferredFormat12='h:mm a' preferredFormat24='HH:mm' />
            </div>
            <div className='sub__title'>
              {isGroup && <span className='sub__eyebrow'>{getLocalizedString('countdown.group')}</span>}
              {!isGroup && event.skip && (
                <span className='sub__eyebrow'>{getLocalizedString('countdown.skipped')}</span>
              )}
              {title}
            </div>
          </button>
        );
      })}

      <div className='fab-container fab-container--selection'>
        <div className='selection-count'>
          {selected.length} {getLocalizedString('countdown.selected')}
        </div>
        <IconButton
          variant='subtle'
          size='large'
          onClick={disableEdit}
          aria-label={getLocalizedString('countdown.cancel_selection')}
          title={getLocalizedString('countdown.cancel_selection')}
        >
          <IoArrowBack />
        </IconButton>
        <Button variant='subtle' size='large' onClick={() => setSelected([])} disabled={selected.length === 0}>
          <IoClose /> {getLocalizedString('countdown.clear')}
        </Button>
        <Button variant='primary' size='large' disabled={events.length < 1} onClick={applySelection}>
          <IoSaveOutline /> {getLocalizedString('countdown.save')}
        </Button>
      </div>
    </div>
  );
}
