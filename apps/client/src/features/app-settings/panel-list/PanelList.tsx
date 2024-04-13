import { Fragment } from 'react';

import { isKeyEnter } from '../../../common/utils/keyEvent';
import { cx } from '../../../common/utils/styleUtils';
import { PanelBaseProps, settingPanels, useSettingsStore } from '../settingsStore';
import useAppSettingsNavigation from '../useAppSettingsNavigation';

import style from './PanelList.module.scss';

interface PanelListProps extends PanelBaseProps {
  selectedPanel: string;
}

export default function PanelList({ selectedPanel, location }: PanelListProps) {
  const { setLocation } = useAppSettingsNavigation();
  const { hasUnsavedChanges } = useSettingsStore();

  return (
    <ul className={style.tabs}>
      {settingPanels.map((panel) => {
        const unsaved = hasUnsavedChanges(panel.id);

        const classes = cx([
          style.primary,
          selectedPanel === panel.id ? style.active : null,
          panel.split ? style.split : null,
          unsaved ? style.unsaved : null,
        ]);

        return (
          <Fragment key={panel.id}>
            <li
              key={panel.id}
              onClick={() => setLocation(panel.id)}
              onKeyDown={(event) => {
                isKeyEnter(event) && setLocation(panel.id);
              }}
              className={classes}
              tabIndex={0}
              role='button'
            >
              {panel.label}
            </li>
            {panel.secondary?.map((secondary) => {
              const id = secondary.id.split('__')[1];
              const secondaryClasses = cx([style.secondary, location === id ? style.active : null]);
              return (
                <li
                  key={secondary.id}
                  onClick={() => setLocation(secondary.id)}
                  onKeyDown={(event) => {
                    isKeyEnter(event) && setLocation(secondary.id);
                  }}
                  className={secondaryClasses}
                  role='button'
                >
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
