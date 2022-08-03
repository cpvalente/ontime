import React, { createContext, useCallback } from 'react';

import { useLocalStorage } from '../hooks/useLocalStorage';

export const CollapseContext = createContext({
  collapsed: {},
  setCollapsed: () => undefined,
  clearCollapsed: () => undefined,
  isCollapsed: () => undefined,
});

export const CollapseProvider = ({ children }) => {
  const [collapsed, saveCollapsed] = useLocalStorage('collapsed', {});

  /**
   * @description Sets collapsed state for a single id
   * @param {string} - id
   * @param {boolean} - collapsed / not collapsed
   */
  const setCollapsed = useCallback(
    (id, isCollapsed) => {
      if (isCollapsed) {
        saveCollapsed((prev) => ({ ...prev, [id]: true }));
      } else {
        saveCollapsed((prev) => {
          const newObject = { ...prev };
          delete newObject[id];
          return { ...newObject };
        });
      }
    },
    [saveCollapsed]
  );

  /**
   * @description Clears collapsed state in local-storage
   */
  const collapseMultiple = useCallback(
    (events) => {
      const newOptions = {};
      for (const event of events) {
        newOptions[event.id] = true;
      }
      saveCollapsed(newOptions);
    },
    [saveCollapsed]
  );

  /**
   * @description Clears collapsed state in local-storage
   */
  const expandAll = useCallback(() => {
    saveCollapsed({});
  }, [saveCollapsed]);

  /**
   * @description Clears collapsed state in local-storage
   * @return {boolean} - collapsed / not collapsed
   */
  const isCollapsed = useCallback(
    (id) => {
      return id in collapsed;
    },
    [collapsed]
  );

  return (
    <CollapseContext.Provider value={{ setCollapsed, collapseMultiple, expandAll, isCollapsed }}>
      {children}
    </CollapseContext.Provider>
  );
};
