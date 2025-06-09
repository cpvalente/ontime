import { useState } from 'react';
import { IoArrowBack, IoClose, IoSaveOutline } from 'react-icons/io5';
import { EntryId, OntimeEvent } from 'ontime-types';

import Button from '../../common/components/buttons/Button';
import { cx } from '../../common/utils/styleUtils';
import ClockTime from '../../features/viewers/common/clock-time/ClockTime';

import { makeSubscriptionsUrl } from './countdown.utils';

import './Countdown.scss';

interface CountdownSelectProps {
  events: OntimeEvent[];
  subscriptions: EntryId[];
  disableEdit: () => void;
}

export default function CountdownSelect(props: CountdownSelectProps) {
  const { events, subscriptions, disableEdit } = props;
  const [selected, setSelected] = useState<EntryId[]>(subscriptions);

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
  const saveSelection = () => {
    const url = makeSubscriptionsUrl(window.location.href, selected);
    window.history.pushState({}, '', url);
    disableEdit();
  };

  // make a copy of the selected array for quick lookup
  const selectedIds = new Set(selected);

  return (
    <div className='list-container'>
      {events.map((event: OntimeEvent, index: number) => {
        const title = event.title || '{no title}';
        const isSelected = selectedIds.has(event.id);

        return (
          <div key={index} className='entry' role='button' onClick={() => toggleSelect(event.id)}>
            <div className={cx(['sub', isSelected && 'sub--selected'])}>
              <div className='sub__binder' style={{ '--user-color': event?.colour ?? '' }} />
              <div className='sub__schedule'>
                <ClockTime value={event.timeStart} preferredFormat12='h:mm' preferredFormat24='HH:mm' />
                →
                <ClockTime value={event.timeEnd} preferredFormat12='h:mm' preferredFormat24='HH:mm' />
              </div>
              <div className='sub__label'>{isSelected ? 'Click to remove' : 'Click to add'}</div>
              <div className='sub__title'>{title}</div>
            </div>
          </div>
        );
      })}

      <div className='fab-container'>
        <Button variant='subtle' size='large' onClick={disableEdit}>
          <IoArrowBack /> Go back
        </Button>
        <Button variant='subtle' size='large' onClick={() => setSelected([])} disabled={selected.length === 0}>
          <IoClose /> Clear
        </Button>
        <Button variant='primary' size='large' disabled={events.length < 1} onClick={saveSelection}>
          <IoSaveOutline /> Save
        </Button>
      </div>
    </div>
  );
}
