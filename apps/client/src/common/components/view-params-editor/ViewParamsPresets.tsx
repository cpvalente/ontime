import { OntimeView, URLPreset } from 'ontime-types';
import { useSearchParams } from 'react-router';

import { useViewUrlPresets } from '../../hooks-query/useUrlPresets';
import { cx } from '../../utils/styleUtils';
import Button from '../buttons/Button';
import Eyebrow from '../eyebrow/Eyebrow';

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
      <div className={style.header}>
        <Eyebrow>Saved presets</Eyebrow>
      </div>
      <div className={style.presetList}>
        {viewPresets.map((preset) => {
          const active = searchParams.get('alias') === preset.alias;
          return (
            <div key={preset.alias} className={cx([style.preset, active && style.active])}>
              <span className={style.presetName}>{preset.alias}</span>
              {active ? (
                <span className={style.current}>Current</span>
              ) : (
                <Button
                  variant='ghosted'
                  size='small'
                  onClick={() => handleRecall(preset)}
                  className={style.presetActions}
                >
                  Apply
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
