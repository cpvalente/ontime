import { ErrorBoundary } from '@sentry/react';

import { useKeyDown } from '../../common/hooks/useKeyDown';
import PanelContent from './panel-content/PanelContent';
import PanelList from './panel-list/PanelList';
import AboutPanel from './panel/about-panel/AboutPanel';
import AutomationPanel from './panel/automations-panel/AutomationPanel';
import FeaturePanel from './panel/feature-panel/FeaturePanel';
import ManagePanel from './panel/manage-panel/ManagePanel';
import NetworkLogPanel from './panel/network-panel/NetworkLogPanel';
import ProjectPanel from './panel/project-panel/ProjectPanel';
import SettingsPanel from './panel/settings-panel/SettingsPanel';
import ShutdownPanel from './panel/shutdown-panel/ShutdownPanel';
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
          {panel === 'settings' && <SettingsPanel location={location} />}
          {panel === 'project' && <ProjectPanel location={location} setLocation={setLocation} />}
          {panel === 'manage' && <ManagePanel location={location} />}
          {panel === 'automation' && <AutomationPanel location={location} />}
          {panel === 'sharing' && <FeaturePanel location={location} />}
          {panel === 'network' && <NetworkLogPanel location={location} />}
          {panel === 'about' && <AboutPanel />}
          {panel === 'shutdown' && <ShutdownPanel />}
        </PanelContent>
      </ErrorBoundary>
    </div>
  );
}
