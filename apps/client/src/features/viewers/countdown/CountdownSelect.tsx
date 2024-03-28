import { Link } from 'react-router-dom';
import { OntimeEvent, OntimeRundownEntry, SupportedEvent } from 'ontime-types';

import Empty from '../../../common/components/state/Empty';
import { formatTime } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';

import { sanitiseTitle } from './countdown.helpers';

import './Countdown.scss';

interface CountdownSelectProps {
  events: OntimeRundownEntry[];
}

const scheduleFormat = { format12: 'hh:mm a', format24: 'HH:mm' };

export default function CountdownSelect(props: CountdownSelectProps) {
  const { events } = props;
  const { getLocalizedString } = useTranslation();

  const filteredEvents = events.filter(
    (event: OntimeRundownEntry) => event.type === SupportedEvent.Event,
  ) as OntimeEvent[];

  return (
    <div className='event-select' data-testid='countdown__select'>
      <span className='event-select__title'>{getLocalizedString('countdown.select_event')}</span>
      <ul className='event-select__events'>
        {!events.length ? (
          <Empty text='No events in database' />
        ) : (
          filteredEvents.map((event: OntimeEvent, counter: number) => {
            const index = counter + 1;
            const title = sanitiseTitle(event.title);
            const start = formatTime(event.timeStart, scheduleFormat);
            const end = formatTime(event.timeEnd, scheduleFormat);

            return (
              <li key={event.id}>
                <Link to={`/countdown?eventid=${event.id}`}>{`${index}. ${start} → ${end} | ${title}`}</Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
