import { KeyboardEvent } from 'react';

import { cx } from '../../../common/utils/styleUtils';
import { settingPanels, SettingsOption, useSettingsStore } from '../settingsStore';

import style from './PanelList.module.scss';

export default function PanelList() {
  const { showSettings, setShowSettings, hasUnsavedChanges } = useSettingsStore();

  const handleSelect = (panel: SettingsOption) => {
    setShowSettings(panel.id);
  };

  const isKeyEnter = (event: KeyboardEvent<HTMLLIElement>) => event.key === 'Enter';

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
