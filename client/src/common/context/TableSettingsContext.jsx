import React, { createContext, useCallback, useState } from 'react';

import { useLocalStorage } from '../hooks/useLocalStorage';

export const TableSettingsContext = createContext({
  theme: '',
  showSettings: false,
  followSelected: false,

  toggleSettings: () => undefined,
  toggleTheme: () => undefined,
  toggleFollow: () => undefined,
});

export const TableSettingsProvider = ({ children }) => {
  const [theme, setTheme] = useLocalStorage('table-color-theme', 'dark');
  const [followSelected, setFollowSelected] = useLocalStorage('table-follow-selected', false);
  const [showSettings, setShowSettings] = useState(false);

  /**
   * @description Toggles the current value of dark mode
   * @param {string} val - 'light' or 'dark'
   */
  const toggleTheme = useCallback(
    (val) => {
      if (val === undefined) {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
      } else {
        setTheme(val);
      }
    },
    [setTheme]
  );

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
    [setShowSettings]
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
    [setFollowSelected]
  );

  return (
    <TableSettingsContext.Provider
      value={{
        theme,
        showSettings,
        followSelected,
        toggleSettings,
        toggleTheme,
        toggleFollow,
      }}
    >
      {children}
    </TableSettingsContext.Provider>
  );
};
