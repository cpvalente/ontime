import { Fragment } from 'react';

import { Tooltip } from '../../../common/components/ui/tooltip';
import { isKeyEnter } from '../../../common/utils/keyEvent';
import { cx } from '../../../common/utils/styleUtils';
import { tooltipDelayFast } from '../../../ontimeConfig';
import { SettingsOption, SettingsOptionId, useAppSettingsMenu } from '../useAppSettingsMenu';
import useAppSettingsNavigation from '../useAppSettingsNavigation';

import style from './PanelList.module.scss';

export interface PanelBaseProps {
  location?: string;
}

interface PanelListProps extends PanelBaseProps {
  selectedPanel: string;
}

export default function PanelList({ selectedPanel, location }: PanelListProps) {
  const { options } = useAppSettingsMenu();

  return (
    <ul className={style.tabs}>
      {options.map((panel) => {
        const isSelected = selectedPanel === panel.id;
        if (panel.highlight) {
          return (
            <Tooltip key={panel.id} content={panel.highlight} openDelay={tooltipDelayFast}>
              <PanelListItem panel={panel} location={location} isSelected={isSelected} />
            </Tooltip>
          );
        }
        return <PanelListItem key={panel.id} panel={panel} location={location} isSelected={isSelected} />;
      })}
    </ul>
  );
}

interface PanelListItemProps {
  panel: SettingsOption;
  isSelected: boolean;
  location?: string;
}

function PanelListItem(props: PanelListItemProps) {
  const { panel, isSelected, location } = props;
  const { setLocation } = useAppSettingsNavigation();

  const classes = cx([
    style.primary,
    isSelected && style.active,
    panel.split && style.split,
    panel.highlight && style.highlight,
  ]);

  return (
    <Fragment key={panel.id}>
      <li
        key={panel.id}
        onClick={() => setLocation(panel.id as SettingsOptionId)}
        onKeyDown={(event) => {
          isKeyEnter(event) && setLocation(panel.id as SettingsOptionId);
        }}
        className={classes}
        tabIndex={0}
        role='button'
      >
        {panel.label}
      </li>
      {panel.secondary?.map((secondary) => {
        const id = secondary.id.split('__')[1];
        const secondaryClasses = cx([style.secondary, isSelected && location === id ? style.active : null]);
        return (
          <li
            key={secondary.id}
            onClick={() => setLocation(secondary.id as SettingsOptionId)}
            onKeyDown={(event) => {
              isKeyEnter(event) && setLocation(secondary.id as SettingsOptionId);
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
}
