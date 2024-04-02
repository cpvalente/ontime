import { ErrorBoundary } from '@sentry/react';

import { useKeyDown } from '../../common/hooks/useKeyDown';

import AboutPanel from './panel/about-panel/AboutPanel';
import ClientControlPanel from './panel/client-control-panel/ClientControlPanel';
import GeneralPanel from './panel/general-panel/GeneralPanel';
import IntegrationsPanel from './panel/integrations-panel/IntegrationsPanel';
import LogPanel from './panel/log-panel/LogPanel';
import ProjectPanel from './panel/project-panel/ProjectPanel';
import ShutdownPanel from './panel/shutdown-panel/ShutdownPanel';
import SourcesPanel from './panel/sources-panel/SourcesPanel';
import PanelContent from './panel-content/PanelContent';
import PanelList from './panel-list/PanelList';
import useAppSettingsNavigation from './useAppSettingsNavigation';

import style from './AppSettings.module.scss';

export default function AppSettings() {
  const { close, panel, location } = useAppSettingsNavigation();
  useKeyDown(close, 'Escape');

  return (
    <div className={style.container}>
      <ErrorBoundary>
        <PanelList selectedPanel={panel} location={location} />
        <PanelContent onClose={close}>
          {panel === 'project' && <ProjectPanel location={location} />}
          {panel === 'general' && <GeneralPanel location={location} />}
          {panel === 'sources' && <SourcesPanel />}
          {panel === 'integrations' && <IntegrationsPanel location={location} />}
          {panel === 'client_control' && <ClientControlPanel />}
          {panel === 'about' && <AboutPanel />}
          {panel === 'network' && <LogPanel />}
          {panel === 'shutdown' && <ShutdownPanel />}
        </PanelContent>
      </ErrorBoundary>
    </div>
  );
}
