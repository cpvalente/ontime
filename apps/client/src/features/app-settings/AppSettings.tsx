import { ErrorBoundary } from '@sentry/react';

import { useKeyDown } from '../../common/hooks/useKeyDown';

import AboutPanel from './panel/about-panel/AboutPanel';
import PanelContent from './panel-content/PanelContent';
import PanelList from './panel-list/PanelList';
import { SettingsOptionId, useSettingsStore } from './settingsStore';

import style from './AppSettings.module.scss';

interface AppSettingsProps {
  settings?: SettingsOptionId;
  onClose: () => void;
}
/**
 * TODO: make store to keep settings
 *       - whether a tab has unsaved changes
 */

export default function AppSettings(props: AppSettingsProps) {
  const { onClose } = props;
  useKeyDown(onClose, 'Escape');
  const selectedPanel = useSettingsStore((state) => state.showSettings);

  return (
    <div className={style.container}>
      <ErrorBoundary>
        <PanelList />
        <PanelContent onClose={onClose}>{selectedPanel === 'about' && <AboutPanel />}</PanelContent>
      </ErrorBoundary>
    </div>
  );
}
