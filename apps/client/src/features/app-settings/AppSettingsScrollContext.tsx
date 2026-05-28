import { createContext, useCallback, useContext, useState } from 'react';

interface ScrollContextValue {
  activeSection: string | undefined;
  setActiveSection: (name: string) => void;
}

export const AppSettingsScrollContext = createContext<ScrollContextValue>({
  activeSection: undefined,
  setActiveSection: () => {},
});

export function useAppSettingsScroll() {
  return useContext(AppSettingsScrollContext);
}

export function useScrollContextState(panel: string) {
  const [activeSection, setActiveSectionRaw] = useState<string | undefined>(undefined);
  const [trackedPanel, setTrackedPanel] = useState(panel);

  if (panel !== trackedPanel) {
    setTrackedPanel(panel);
    setActiveSectionRaw(undefined);
  }

  const setActiveSection = useCallback((name: string) => {
    setActiveSectionRaw(name);
  }, []);

  return { activeSection, setActiveSection };
}
