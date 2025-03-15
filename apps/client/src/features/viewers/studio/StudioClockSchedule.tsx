import { isOntimeEvent, MaybeString, OntimeEntry, OntimeEvent } from 'ontime-types';

import { formatTime } from '../../../common/utils/time';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';

import { trimRundown } from './studioClock.utils';

import './StudioClock.scss';

interface StudioClockScheduleProps {
  rundown: OntimeEntry[];
  selectedId: MaybeString;
  nextId: MaybeString;
  onAir: boolean;
}

// TODO: fit titles on screen
const MAX_TITLES = 11;

export default function StudioClockSchedule(props: StudioClockScheduleProps) {
  const { rundown, selectedId, nextId, onAir } = props;

  const delayed = rundown.filter((event) => isOntimeEvent(event)) as OntimeEvent[];
  const trimmedRundown = trimRundown(delayed, selectedId, MAX_TITLES);

  return (
    <div className='schedule-container'>
      <div className={onAir ? 'onAir' : 'onAir onAir--idle'} data-testid={onAir ? 'on-air-enabled' : 'on-air-disabled'}>
        ON AIR
      </div>
      <ul className='schedule'>
        {trimmedRundown.map((event) => {
          const start = formatTime(event.timeStart + (event?.delay ?? 0), { format12: 'h:mm a', format24: 'HH:mm' });
          const isSelected = event.id === selectedId;
          const isNext = event.id === nextId;
          const classes = `schedule__item schedule__item${isSelected ? '--now' : isNext ? '--next' : '--future'}`;
          return (
            <li key={event.id} className={classes}>
              <span className='event'>
                <span className='event__colour' style={{ backgroundColor: `${event.colour}` }} />
                <SuperscriptTime time={start} />
              </span>
              <span>{event.title}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
