import { useState } from 'react';
import { IconButton } from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { ErrorBoundary } from '@sentry/react';

import { useKeyDown } from '../../common/hooks/useKeyDown';
import { cx } from '../../common/utils/styleUtils';

import { settingPanels, SettingsOption, SettingsOptionId } from './settingsStore';

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
  const { settings = settingPanels[0].id, onClose } = props;
  useKeyDown(onClose, 'Escape');

  const [selectedTab, setSelectedTab] = useState<SettingsOptionId>(settings);

  const handleTabSelect = (newTab: SettingsOption) => {
    setSelectedTab(newTab.id);
  };

  return (
    <div className={style.container}>
      <ErrorBoundary>
        <ul className={style.tabs}>
          {settingPanels.map((panel) => {
            const hasUnsavedChanges = Math.random() > 0.5;

            const classes = cx([
              style.primary,
              selectedTab === panel.id ? style.active : null,
              panel.split ? style.split : null,
              hasUnsavedChanges ? style.unsaved : null,
            ]);

            return (
              <>
                <li key={panel.id} onClick={() => handleTabSelect(panel)} className={classes}>
                  {panel.label}
                </li>
                {panel.secondary?.map((secondary) => {
                  return (
                    <li key={secondary.id} onClick={() => handleTabSelect(panel)} className={style.secondary}>
                      {secondary.label}
                    </li>
                  );
                })}
              </>
            );
          })}
        </ul>
        <div className={style.contentWrapper}>
          <div className={style.corner}>
            <IconButton onClick={onClose} aria-label='close' icon={<IoClose />} variant='ontime-ghosted-white' />
          </div>
          <div className={style.content}>
            {Array.from({ length: 100 }).map((_, index) => {
              return <div key={index}>TESTING</div>;
            })}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
