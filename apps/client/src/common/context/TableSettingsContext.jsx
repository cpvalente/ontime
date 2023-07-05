import { createContext, useCallback, useState } from 'react';

import { useLocalStorage } from '../hooks/useLocalStorage';

export const TableSettingsContext = createContext({
  showSettings: false,
  followSelected: false,
  showDelayBlock: false,

  toggleSettings: () => undefined,
  toggleFollow: () => undefined,
  toggleDelayVisibility: () => undefined,
});

export const TableSettingsProvider = ({ children }) => {
  const [followSelected, setFollowSelected] = useLocalStorage('table-follow-selected', false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDelayBlock, setShowDelayBlock] = useLocalStorage('table-show-delay', false);

  /**
   * @description Toggles visibility state for settings
   * @param {boolean} val - whether the settings window is visible
   */
  const toggleSettings = useCallback(
    (val) => {
      if (val === undefined) {
        setShowSettings((prev) => !prev);
      } else {
        setShowSettings(val);
      }
    },
    [setShowSettings],
  );

  /**
   * @description Toggles follow option
   * @param {boolean} val - whether the window follows selected event
   */
  const toggleFollow = useCallback(
    (val) => {
      if (val === undefined) {
        setFollowSelected((prev) => !prev);
      } else {
        setFollowSelected(val);
      }
    },
    [setFollowSelected],
  );

  /**
   * @description Toggles visibility of delay blocks
   * @param {boolean} val - whether the delay blocks are shown in the list
   */
  const toggleDelayVisibility = useCallback(
    (val) => {
      if (val === undefined) {
        setShowDelayBlock((prev) => !prev);
      } else {
        setShowDelayBlock(val);
      }
    },
    [setShowDelayBlock],
  );

  return (
    <TableSettingsContext.Provider
      value={{
        showSettings,
        followSelected,
        showDelayBlock,
        toggleSettings,
        toggleFollow,
        toggleDelayVisibility,
      }}
    >
      {children}
    </TableSettingsContext.Provider>
  );
};
