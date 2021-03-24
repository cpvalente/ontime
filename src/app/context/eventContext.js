import { createContext, useState } from 'react';

export const EventContext = createContext();

export function EventProvider(props) {
  const [event, setEvent] = useState(null);

  return (
    <EventContext.Provider value={[event, setEvent]}>
      {props.children}
    </EventContext.Provider>
  );
}
