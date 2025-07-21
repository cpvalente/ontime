import { useSearchParams } from 'react-router-dom';
import { OntimeView, URLPreset } from 'ontime-types';

import { useViewUrlPresets } from '../../hooks-query/useUrlPresets';
import Button from '../buttons/Button';
import CopyTag from '../copy-tag/CopyTag';

import style from './ViewParamsShare.module.scss';

/**
 * Shows a list of presets for the current view
 * TODO: can we show which preset is active?
 */
export function ViewParamsShare({ target }: { target: OntimeView }) {
  const { viewPresets } = useViewUrlPresets(target);
  const [_, setSearchParams] = useSearchParams();

  const handleRecall = (preset: URLPreset) => {
    setSearchParams(preset.search);
  };

  if (viewPresets.length === 0) {
    return null;
  }

  return (
    <div className={style.presetSection}>
      {viewPresets.map((preset) => {
        const url = new URL(window.location.href);
        url.search = preset.search;
        const urlToCopy = url.toString();

        return (
          <div key={preset.alias} className={style.preset}>
            <div>{preset.alias}</div>
            <div className={style.presetActions}>
              <Button variant='subtle-white' onClick={() => handleRecall(preset)}>
                Apply
              </Button>
              <CopyTag copyValue={urlToCopy}>Copy share link</CopyTag>
            </div>
          </div>
        );
      })}
    </div>
  );
}
