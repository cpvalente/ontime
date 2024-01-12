import { Fragment } from 'react';

import { isKeyEnter } from '../../../common/utils/keyEvent';
import { cx } from '../../../common/utils/styleUtils';
import { settingPanels, SettingsOption, useSettingsStore } from '../settingsStore';

import style from './PanelList.module.scss';

export default function PanelList() {
  const { showSettings, setShowSettings, hasUnsavedChanges } = useSettingsStore();

  const handleSelect = (panel: SettingsOption) => {
    setShowSettings(panel.id);
  };

  return (
    <ul className={style.tabs}>
      {settingPanels.map((panel) => {
        const unsaved = hasUnsavedChanges(panel.id);

        const classes = cx([
          style.primary,
          showSettings === panel.id ? style.active : null,
          panel.split ? style.split : null,
          unsaved ? style.unsaved : null,
        ]);

        return (
          <Fragment key={panel.id}>
            <li
              key={panel.id}
              onClick={() => handleSelect(panel)}
              onKeyDown={(event) => {
                isKeyEnter(event) && handleSelect(panel);
              }}
              className={classes}
              tabIndex={0}
              role='button'
            >
              {panel.label}
            </li>
            {panel.secondary?.map((secondary) => {
              return (
                <li key={secondary.id} onClick={() => handleSelect(panel)} className={style.secondary}>
                  {secondary.label}
                </li>
              );
            })}
          </Fragment>
        );
      })}
    </ul>
  );
}
