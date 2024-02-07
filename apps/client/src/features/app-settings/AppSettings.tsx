import { ErrorBoundary } from '@sentry/react';

import { useKeyDown } from '../../common/hooks/useKeyDown';

import AboutPanel from './panel/about-panel/AboutPanel';
import IntegrationsPanel from './panel/integrations-panel/IntegrationsPanel';
import LogPanel from './panel/log-panel/LogPanel';
import ProjectPanel from './panel/project-panel/ProjectPanel';
import ProjectSettingsPanel from './panel/project-settings-panel/ProjectSettingsPanel';
import SourcesPanel from './panel/sources-panel/SourcesPanel';
import PanelContent from './panel-content/PanelContent';
import PanelList from './panel-list/PanelList';
import { useSettingsStore } from './settingsStore';

import style from './AppSettings.module.scss';
import GeneralPanel from './panel/general-panel/GeneralPanel';

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
        <PanelContent onClose={closeSettings}>
          {selectedPanel === 'project' && <ProjectPanel />}
          {selectedPanel === 'general' && <GeneralPanel />}
          {selectedPanel === 'sources' && <SourcesPanel />}
          {selectedPanel === 'integrations' && <IntegrationsPanel />}
          {selectedPanel === 'project_settings' && <ProjectSettingsPanel />}
          {selectedPanel === 'about' && <AboutPanel />}
          {selectedPanel === 'log' && <LogPanel />}
        </PanelContent>
      </ErrorBoundary>
    </div>
  );
}
