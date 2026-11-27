import { ErrorBoundary } from '@sentry/react';

import { useKeyDown } from '../../common/hooks/useKeyDown';
import PanelContent from './panel-content/PanelContent';
import PanelList from './panel-list/PanelList';
import AboutPanel from './panel/about-panel/AboutPanel';
import ImportPanel from './panel/import-panel/ImportPanel';
import IntegrationsPanel from './panel/integrations-panel/IntegrationsPanel';
import ProjectPanel from './panel/project-panel/ProjectPanel';
import RundownPanel from './panel/rundown-panel/RundownPanel';
import ServerPanel from './panel/server-panel/ServerPanel';
import SharingPanel from './panel/sharing-panel/SharingPanel';
import ShutdownPanel from './panel/shutdown-panel/ShutdownPanel';
import ViewsPanel from './panel/views-panel/ViewsPanel';
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
          {panel === 'rundown' && <RundownPanel location={location} />}
          {panel === 'import' && <ImportPanel />}
          {panel === 'views' && <ViewsPanel location={location} />}
          {panel === 'sharing' && <SharingPanel location={location} />}
          {panel === 'integrations' && <IntegrationsPanel location={location} />}
          {panel === 'server' && <ServerPanel location={location} />}
          {panel === 'about' && <AboutPanel />}
          {panel === 'shutdown' && <ShutdownPanel />}
        </PanelContent>
      </ErrorBoundary>
    </div>
  );
}
