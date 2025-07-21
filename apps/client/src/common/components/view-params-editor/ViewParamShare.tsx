import { useSearchParams } from 'react-router-dom';
import { OntimeView, URLPreset } from 'ontime-types';

import { useViewUrlPresets } from '../../hooks-query/useUrlPresets';
import { cx } from '../../utils/styleUtils';
import Button from '../buttons/Button';

import style from './ViewParamsShare.module.scss';

/**
 * Shows a list of presets for the current view
 */
export function ViewParamsShare({ target }: { target: OntimeView }) {
  const { viewPresets } = useViewUrlPresets(target);
  const [_, setSearchParams] = useSearchParams();

  const handleRecall = (preset: URLPreset) => {
    setSearchParams(`${preset.search}&alias=${preset.alias}`);
  };

  if (viewPresets.length === 0) {
    return null;
  }

  return (
    <div className={style.presetSection}>
      {viewPresets.map((preset) => {
        const active = window.location.search.includes(`alias=${preset.alias}`);
        return (
          <div key={preset.alias} className={cx([style.preset, active && style.active])}>
            <div>{preset.alias}</div>
            <Button
              variant='subtle-white'
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
