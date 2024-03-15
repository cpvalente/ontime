import { useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from '@sentry/react';

import { useKeyDown } from '../../common/hooks/useKeyDown';

import AboutPanel from './panel/about-panel/AboutPanel';
import GeneralPanel from './panel/general-panel/GeneralPanel';
import IntegrationsPanel from './panel/integrations-panel/IntegrationsPanel';
import InterfacePanel from './panel/interface-panel/InterfacePanel';
import LogPanel from './panel/log-panel/LogPanel';
import ProjectPanel from './panel/project-panel/ProjectPanel';
import ProjectSettingsPanel from './panel/project-settings-panel/ProjectSettingsPanel';
import SourcesPanel from './panel/sources-panel/SourcesPanel';
import PanelContent from './panel-content/PanelContent';
import PanelList from './panel-list/PanelList';
import useAppSettingsNavigation from './useAppSettingsNavigation';

import style from './AppSettings.module.scss';

export default function AppSettings() {
  const { close, panel, location } = useAppSettingsNavigation();

  return (
    <div className={style.container}>
      <ErrorBoundary>
        <PanelList selectedPanel={panel} location={location} />
        <PanelContent onClose={close}>
          {panel === 'project' && <ProjectPanel location={location} />}
          {panel === 'general' && <GeneralPanel location={location} />}
          {panel === 'project_settings' && <ProjectSettingsPanel />}
          {panel === 'sources' && <SourcesPanel />}
          {panel === 'interface' && <InterfacePanel />}
          {panel === 'integrations' && <IntegrationsPanel location={location} />}
          {panel === 'about' && <AboutPanel />}
          {panel === 'log' && <LogPanel />}
        </PanelContent>
      </ErrorBoundary>
    </div>
  );
}
