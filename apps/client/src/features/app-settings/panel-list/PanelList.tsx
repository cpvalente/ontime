import { KeyboardEvent } from 'react';

import { cx } from '../../../common/utils/styleUtils';
import { settingPanels, SettingsOption, useSettingsStore } from '../settingsStore';

import style from './PanelList.module.scss';

export default function PanelList() {
  const data = useSettingsStore();

  const handleSelect = (panel: SettingsOption) => {
    data.setShowSettings(panel.id);
  };

  const isKeyEnter = (event: KeyboardEvent<HTMLLIElement>) => event.key === 'Enter';

  return (
    <ul className={style.tabs}>
      {settingPanels.map((panel) => {
        const hasUnsavedChanges = Math.random() > 0.5;

        const classes = cx([
          style.primary,
          data.showSettings === panel.id ? style.active : null,
          panel.split ? style.split : null,
          hasUnsavedChanges ? style.unsaved : null,
        ]);

        return (
          <>
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
          </>
        );
      })}
    </ul>
  );
}
