import { createContext, useState } from 'react';

export const LocalEventSettingsContext = createContext({
  showQuickEntry: false,
  starTimeIsLastEnd: true,
  defaultPrivate: false,

  setShowQuickEntry: () => undefined,
  setStarTimeIsLastEnd: () => undefined,
  setDefaultPrivate: () => undefined,
});

export const LocalEventSettingsProvider = (props) => {
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [starTimeIsLastEnd, setStarTimeIsLastEnd] = useState(true);
  const [defaultPrivate, setDefaultPrivate] = useState(false);

  return (
    <LocalEventSettingsContext.Provider
      value={{
        showQuickEntry,
        setShowQuickEntry,
        starTimeIsLastEnd,
        setStarTimeIsLastEnd,
        defaultPrivate,
        setDefaultPrivate,
      }}
    >
      {props.children}
    </LocalEventSettingsContext.Provider>
  );
};
