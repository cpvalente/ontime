import { useSearchParams } from 'react-router';
import { OntimeView, URLPreset } from 'ontime-types';

import { useViewUrlPresets } from '../../hooks-query/useUrlPresets';
import { cx } from '../../utils/styleUtils';
import Button from '../buttons/Button';

import style from './ViewParamsPresets.module.scss';

/**
 * Shows a list of presets for the current view
 */
export function ViewParamsPresets({ target }: { target: OntimeView }) {
  const { viewPresets } = useViewUrlPresets(target);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleRecall = (preset: URLPreset) => {
    const newSearch = new URLSearchParams(preset.search);
    newSearch.set('alias', preset.alias);
    setSearchParams(newSearch);
  };

  if (viewPresets.length === 0) {
    return null;
  }

  return (
    <div className={style.presetSection}>
      {viewPresets.map((preset) => {
        const active = searchParams.get('alias') === preset.alias;
        return (
          <div key={preset.alias} className={cx([style.preset, active && style.active])}>
            <div>{preset.alias}</div>
            <Button
              variant={active ? 'ghosted' : 'subtle-white'}
              onClick={() => handleRecall(preset)}
              disabled={active}
              className={style.presetActions}
            >
              {active ? 'Applied' : 'Apply'}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
