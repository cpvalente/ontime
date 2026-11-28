import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { type SettingsOptionId, staticOptions } from './useAppSettingsMenu';

const settingsKey = 'settings';
const panelIds = new Set<string>(staticOptions.map((option) => option.id));

export default function useAppSettingsNavigation() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedPanel = useMemo(
    () => (searchParams.get(settingsKey) as SettingsOptionId | null) ?? 'project',
    [searchParams],
  );
  const isOpen = useMemo(() => Boolean(searchParams.get(settingsKey)), [searchParams]);
  const [requestedPanel, requestedLocation] = selectedPanel.split('__');
  // an unknown id, such as a link from an older version, opens the first panel
  const isKnownPanel = panelIds.has(requestedPanel);
  const panel = isKnownPanel ? requestedPanel : 'project';
  const location = isKnownPanel ? requestedLocation : undefined;

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
