import React, { createContext, useState } from 'react';

export const LocalEventSettingsContext = createContext({
  showQuickEntry: false,
  starTimeIsLastEnd: true,
  defaultPublic: true,

  setShowQuickEntry: () => undefined,
  setStarTimeIsLastEnd: () => undefined,
  setDefaultPublic: () => undefined,
});

export const LocalEventSettingsProvider = (props) => {
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [starTimeIsLastEnd, setStarTimeIsLastEnd] = useState(true);
  const [defaultPublic, setDefaultPublic] = useState(false);

  return (
    <LocalEventSettingsContext.Provider
      value={{
        showQuickEntry,
        setShowQuickEntry,
        starTimeIsLastEnd,
        setStarTimeIsLastEnd,
        defaultPublic,
        setDefaultPublic,
      }}
    >
      {props.children}
    </LocalEventSettingsContext.Provider>
  );
};
