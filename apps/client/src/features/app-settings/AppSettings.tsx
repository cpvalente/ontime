import { ErrorBoundary } from '@sentry/react';

import { useKeyDown } from '../../common/hooks/useKeyDown';

import AboutPanel from './panel/about-panel/AboutPanel';
import AutomationPanel from './panel/automations-panel/AutomationPanel';
import FeatureSettingsPanel from './panel/feature-settings-panel/FeatureSettingsPanel';
import GeneralPanel from './panel/general-panel/GeneralPanel';
import NetworkLogPanel from './panel/network-panel/NetworkLogPanel';
import ProjectPanel from './panel/project-panel/ProjectPanel';
import ShutdownPanel from './panel/shutdown-panel/ShutdownPanel';
import SourcesPanel from './panel/sources-panel/SourcesPanel';
import PanelContent from './panel-content/PanelContent';
import PanelList from './panel-list/PanelList';
import useAppSettingsNavigation from './useAppSettingsNavigation';

import style from './AppSettings.module.scss';

export default function AppSettings() {
  const { close, panel, location, setLocation } = useAppSettingsNavigation();
  useKeyDown(close, 'Escape');

  return (
    <div className={style.container}>
      <ErrorBoundary>
        <PanelList selectedPanel={panel} location={location} />
        <PanelContent onClose={close}>
          {panel === 'project' && <ProjectPanel location={location} setLocation={setLocation} />}
          {panel === 'general' && <GeneralPanel location={location} />}
          {panel === 'feature_settings' && <FeatureSettingsPanel location={location} />}
          {panel === 'sources' && <SourcesPanel />}
          {panel === 'automation' && <AutomationPanel location={location} />}
          {panel === 'network' && <NetworkLogPanel location={location} />}
          {panel === 'about' && <AboutPanel />}
          {panel === 'shutdown' && <ShutdownPanel />}
        </PanelContent>
      </ErrorBoundary>
    </div>
  );
}
