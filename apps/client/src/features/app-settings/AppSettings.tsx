import { ErrorBoundary } from '@sentry/react';

import { useKeyDown } from '../../common/hooks/useKeyDown';

import AboutPanel from './panel/about-panel/AboutPanel';
import PanelContent from './panel-content/PanelContent';
import PanelList from './panel-list/PanelList';
import { useSettingsStore } from './settingsStore';

import style from './AppSettings.module.scss';

export default function AppSettings() {
  const setShowSettings = useSettingsStore((state) => state.setShowSettings);
  const selectedPanel = useSettingsStore((state) => state.showSettings);

  const closeSettings = () => {
    setShowSettings(null);
  };
  useKeyDown(closeSettings, 'Escape');

  return (
    <div className={style.container}>
      <ErrorBoundary>
        <PanelList />
        <PanelContent onClose={closeSettings}>{selectedPanel === 'about' && <AboutPanel />}</PanelContent>
      </ErrorBoundary>
    </div>
  );
}
