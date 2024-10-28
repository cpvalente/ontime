import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { SettingsOptionId } from './useAppSettingsMenu';

const settingsKey = 'settings';

export default function useAppSettingsNavigation() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedPanel = useMemo(
    () => (searchParams.get(settingsKey) as SettingsOptionId | null) ?? 'project',
    [searchParams],
  );
  const isOpen = useMemo(() => Boolean(searchParams.get(settingsKey)), [searchParams]);
  const [panel, location] = selectedPanel.split('__');

  const close = useCallback(() => {
    searchParams.delete(settingsKey);
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const setLocation = useCallback(
    (panelId: SettingsOptionId) => {
      searchParams.set(settingsKey, panelId);
      setSearchParams(searchParams);
    },
    [searchParams, setSearchParams],
  );

  return { isOpen, panel, location, setLocation, close };
}
