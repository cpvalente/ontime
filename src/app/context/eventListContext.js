import { createContext, useState } from 'react';
import { sampleData } from '../sampleData';

export const EventListContext = createContext([[], () => {}]);

export function EventListProvider(props) {
  const [events, setEvents] = useState(sampleData.events);

  return (
    <EventListContext.Provider value={[events, setEvents]}>
      {props.children}
    </EventListContext.Provider>
  );
}
