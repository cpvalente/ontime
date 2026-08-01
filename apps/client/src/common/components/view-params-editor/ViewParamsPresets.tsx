import { OntimeView, OntimeViewPresettable, URLPreset } from 'ontime-types';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { canConfigureFromView } from '../../../externals';
import { maybeAxiosError } from '../../api/utils';
import { useUpdateUrlPreset } from '../../hooks-query/useUrlPresets';
import { isUrlSafe } from '../../utils/regex';
import { cx } from '../../utils/styleUtils';
import Button from '../buttons/Button';
import Input from '../input/input/Input';
import { useAppliedPreset } from './useAppliedPreset';

import style from './ViewParamsPresets.module.scss';

/**
 * Shows the URL presets for the current view and allows saving the current
 * customisation as one, so that presets are made where they are used.
 */
export function ViewParamsPresets({ target }: { target: OntimeView }) {
  const { viewPresets } = useAppliedPreset(target);
  const [searchParams, setSearchParams] = useSearchParams();

  const canEdit = canConfigureFromView();

  const handleRecall = (preset: URLPreset) => {
    const newSearch = new URLSearchParams(preset.search);
    newSearch.set('alias', preset.alias);
    setSearchParams(newSearch);
  };

  if (viewPresets.length === 0 && !canEdit) {
    return null;
  }

  return (
    <div className={style.presetSection}>
      <div className={style.sectionTitle}>URL presets</div>
      <div className={style.presetList}>
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
      {canEdit && target !== OntimeView.Editor && <PresetWriter target={target} />}
    </div>
  );
}

/**
 * Saves the current view customisation as a URL preset.
 * When the applied preset has drifted from the current parameters, we offer to update it instead.
 */
function PresetWriter({ target }: { target: OntimeViewPresettable }) {
  const { viewPresets, appliedPreset, hasDrifted, currentParams } = useAppliedPreset(target);
  const [searchParams, setSearchParams] = useSearchParams();
  const { addPreset, updatePreset, isMutating } = useUpdateUrlPreset();
  const [alias, setAlias] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!appliedPreset) return;
    try {
      setError(null);
      await updatePreset(appliedPreset.alias, { ...appliedPreset, search: currentParams });
    } catch (error) {
      setError(maybeAxiosError(error));
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      await addPreset({ alias, target, search: currentParams, enabled: true, displayInNav: false });
      // mark the new preset as the one in use, it becomes the target of a share link
      const newSearch = new URLSearchParams(searchParams);
      newSearch.set('alias', alias);
      setSearchParams(newSearch);
      setAlias('');
    } catch (error) {
      setError(maybeAxiosError(error));
    }
  };

  // an alias must be unique and safe to place in a URL
  const aliasError = (() => {
    if (!alias) return null;
    if (!isUrlSafe.test(alias)) return 'Use only a-z, 0-9, _ and -';
    if (viewPresets.some((preset) => preset.alias === alias)) return 'Alias already in use';
    return null;
  })();

  return (
    <div className={style.writer}>
      {appliedPreset && hasDrifted && (
        <Button variant='subtle-white' onClick={handleUpdate} disabled={isMutating} className={style.updateAction}>
          Update {appliedPreset.alias}
        </Button>
      )}
      <div className={style.saveRow}>
        <Input
          value={alias}
          onChange={(event) => setAlias(event.target.value)}
          placeholder='New preset alias'
          aria-label='New preset alias'
          fluid
        />
        <Button
          variant='subtle-white'
          onClick={handleSave}
          disabled={!alias || aliasError !== null || isMutating}
          loading={isMutating}
        >
          Save
        </Button>
      </div>
      {(aliasError || error) && <div className={style.error}>{aliasError ?? error}</div>}
    </div>
  );
}
