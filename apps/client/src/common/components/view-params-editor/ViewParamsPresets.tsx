import { OntimeView, URLPreset } from 'ontime-types';
import { useSearchParams } from 'react-router';

import { useViewUrlPresets } from '../../hooks-query/useUrlPresets';
import { reservedParams } from '../../stores/savedViewParams';
import { cx } from '../../utils/styleUtils';
import { parseUrlPresetAlias } from '../../utils/urlPresets';
import Button from '../buttons/Button';
import { SectionHeader } from './ViewParamsSection';

import style from './ViewParamsPresets.module.scss';

/**
 * Shows a list of presets for the current view
 */
export function ViewParamsPresets({ target }: { target: OntimeView }) {
  const { viewPresets } = useViewUrlPresets(target);
  const [searchParams, setSearchParams] = useSearchParams();
  const alias = parseUrlPresetAlias(searchParams.get('alias'));

  const handleRecall = (preset: URLPreset) => {
    const newSearch = new URLSearchParams(preset.search);
    // keep the access token and navigation lock of the current URL
    searchParams.forEach((value, key) => {
      if (reservedParams.has(key)) {
        newSearch.set(key, value);
      }
    });
    newSearch.set('alias', preset.alias);
    setSearchParams(newSearch);
  };

  if (viewPresets.length === 0) {
    return null;
  }

  return (
    <section className={style.presetSection}>
      <SectionHeader title='Saved presets' isCustomised={false} collapsed={false} />
      <div className={style.presetList}>
        {viewPresets.map((preset) => {
          const active = alias === preset.alias;
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
    </section>
  );
}
