import { createContext, useState } from 'react';

export const PresenterMessagesContext = createContext([[], () => {}]);

export function PresenterMessageProvider(props) {
  const [presMessage, setPresMessage] = useState({
    text: '',
    show: '',
  });

  return (
    <PresenterMessagesContext.Provider value={[presMessage, setPresMessage]}>
      {props.children}
    </PresenterMessagesContext.Provider>
  );
}
