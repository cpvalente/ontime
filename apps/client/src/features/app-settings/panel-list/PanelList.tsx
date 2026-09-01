import { Fragment, useState } from 'react';

import Tooltip from '../../../common/components/tooltip/Tooltip';
import { isKeyEnter } from '../../../common/utils/keyEvent';
import { cx } from '../../../common/utils/styleUtils';
import * as Panel from '../panel-utils/PanelUtils';
import {
  filterSettingsOptions,
  matchesSettingsOptionQuery,
  SettingsOption,
  SettingsOptionId,
  useAppSettingsMenu,
} from '../useAppSettingsMenu';
import useAppSettingsNavigation from '../useAppSettingsNavigation';
import SettingsSearch from './SettingsSearch';

import style from './PanelList.module.scss';

export interface PanelBaseProps {
  location?: string;
}

interface PanelListProps extends PanelBaseProps {
  selectedPanel: string;
}

/** Returns the first matching setting, preferring a matching child over its non-matching group. */
function getFirstResultId(results: SettingsOption[], query: string): SettingsOptionId | null {
  const firstResult = results[0];
  if (!firstResult) {
    return null;
  }

  if (matchesSettingsOptionQuery(firstResult, query.trim().toLowerCase())) {
    return firstResult.id as SettingsOptionId;
  }

  return (firstResult.secondary?.[0]?.id as SettingsOptionId | undefined) ?? null;
}

export default function PanelList({ selectedPanel, location }: PanelListProps) {
  const { options } = useAppSettingsMenu();
  const { setLocation } = useAppSettingsNavigation();
  const [query, setQuery] = useState('');

  const results = filterSettingsOptions(options, query);

  const handleSearchSubmit = () => {
    const target = getFirstResultId(results, query);
    if (target) {
      setLocation(target);
      setQuery('');
    }
  };

  return (
    <div className={style.container}>
      <SettingsSearch query={query} onQueryChange={setQuery} onSubmit={handleSearchSubmit} />

      {results.length === 0 ? (
        <Panel.EmptyState title='No settings match' description={`Nothing found for "${query.trim()}"`} />
      ) : (
        <ul className={style.tabs}>
          {results.map((panel) => {
            const isSelected = selectedPanel === panel.id;
            if (panel.highlight) {
              return (
                <Tooltip key={panel.id} text={panel.highlight} render={<span />}>
                  <PanelListItem panel={panel} location={location} isSelected={isSelected} />
                </Tooltip>
              );
            }
            return <PanelListItem key={panel.id} panel={panel} location={location} isSelected={isSelected} />;
          })}
        </ul>
      )}
    </div>
  );
}

interface PanelListItemProps {
  panel: SettingsOption;
  isSelected: boolean;
  location?: string;
}

function PanelListItem({ panel, isSelected, location }: PanelListItemProps) {
  const { setLocation } = useAppSettingsNavigation();
  const hasSelectedChild = Boolean(
    isSelected && panel.secondary?.some((secondary) => secondary.id.split('__')[1] === location),
  );
  const classes = cx([
    style.primary,
    isSelected && !hasSelectedChild && style.active,
    hasSelectedChild && style.groupActive,
    panel.highlight && style.highlight,
  ]);

  return (
    <Fragment key={panel.id}>
      <li
        key={panel.id}
        onClick={() => setLocation(panel.id as SettingsOptionId)}
        onKeyDown={(event) => {
          if (isKeyEnter(event)) {
            setLocation(panel.id as SettingsOptionId);
          }
        }}
        className={classes}
        tabIndex={0}
        role='button'
      >
        {panel.label}
      </li>
      {panel.secondary?.map((secondary, index) => {
        const id = secondary.id.split('__')[1];
        const secondaryClasses = cx([style.secondary, isSelected && location === id ? style.active : null]);
        return (
          <li
            key={secondary.id + index}
            onClick={() => setLocation(secondary.id as SettingsOptionId)}
            onKeyDown={(event) => {
              if (isKeyEnter(event)) {
                setLocation(secondary.id as SettingsOptionId);
              }
            }}
            className={secondaryClasses}
            tabIndex={0}
            role='button'
          >
            {secondary.label}
          </li>
        );
      })}
    </Fragment>
  );
}
