import { useState } from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import { EntryId, OntimeEvent } from 'ontime-types';

import IconButton from '../../common/components/buttons/IconButton';
import { cx } from '../../common/utils/styleUtils';
import { formatTime } from '../../common/utils/time';

import './Countdown.scss';

interface CountdownSelectProps {
  events: OntimeEvent[];
  subscriptions: EntryId[];
}

export default function CountdownSelect(props: CountdownSelectProps) {
  const { events, subscriptions } = props;

  const [selected, setSelected] = useState<EntryId[]>([]);

  const toggleSelect = (entryId: EntryId) => {
    setSelected((prev) => (prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]));
  };

  return (
    <>
      {events.map((event: OntimeEvent, index: number) => {
        const title = event.title || '{no title}';
        const start = formatTime(event.timeStart);
        const end = formatTime(event.timeEnd);
        const hasSubscription = subscriptions.includes(event.id);

        return (
          <div key={index} className='entry' role='button' onClick={() => toggleSelect(event.id)}>
            <div className={cx(['sub', 'sub--interactive', hasSubscription && 'sub--subscribed'])}>
              <div className='sub__binder' style={{ '--user-color': `red` }} />
              <div className='sub__schedule'>
                {start} - {end}
              </div>
              <div className='sub__playback'>Playing</div>
              <div className='sub__title'>{title}</div>
              <div className='sub__timer'>15:00</div>
            </div>
            <IconButton variant={hasSubscription ? 'destructive' : 'subtle'} className='entry-button'>
              <IoTrashOutline />
            </IconButton>
          </div>
        );
      })}
    </>
  );
}
