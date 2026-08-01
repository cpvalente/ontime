import { OntimeView, URLPreset } from 'ontime-types';
import { useState } from 'react';
import { IoAdd, IoOpenOutline, IoPencil, IoTrash } from 'react-icons/io5';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import Switch from '../../../../common/components/switch/Switch';
import Tag from '../../../../common/components/tag/Tag';
import useUrlPresets, { useUpdateUrlPreset } from '../../../../common/hooks-query/useUrlPresets';
import { handleLinks } from '../../../../common/utils/linkUtils';
import { enDash } from '../../../../common/utils/styleUtils';
import { describePermission } from '../../../../common/utils/urlPresets';
import * as Panel from '../../panel-utils/PanelUtils';
import URLPresetForm from './composite/URLPresetForm';

import style from './URLPresets.module.scss';

type FormState = {
  isOpen: boolean;
  preset?: URLPreset;
};

const urlPresetsDocs = 'https://docs.getontime.no/features/url-presets/';

export default function URLPresets() {
  const [formState, setFormState] = useState<FormState>({ isOpen: false, preset: undefined });
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, status } = useUrlPresets();
  const { updatePreset, deletePreset, isMutating } = useUpdateUrlPreset();

  const openNewForm = () => setFormState({ isOpen: true });
  const openEditForm = (preset: URLPreset) => setFormState({ isOpen: true, preset });
  const closeForm = () => setFormState({ isOpen: false, preset: undefined });

  const persistPreset = async (preset: URLPreset) => {
    setActionError(null);
    try {
      await updatePreset(preset.alias, preset);
    } catch (error) {
      setActionError(maybeAxiosError(error));
    }
  };

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>
          URL presets
          <Button onClick={openNewForm}>
            New <IoAdd />
          </Button>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Panel.Loader isLoading={status === 'pending'} />
          {formState.isOpen && <URLPresetForm urlPreset={formState.preset} onClose={closeForm} />}
          {actionError && <Panel.Error>{actionError}</Panel.Error>}
          <Panel.Table>
            <thead>
              <tr>
                <th>Enabled</th>
                <th>Show in nav</th>
                <th>Target view</th>
                <th>Alias</th>
                <th>Options</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <Panel.TableEmpty label='No URL presets yet' handleClick={openNewForm} />}
              {data.map((preset, index) => {
                const isCuesheet = preset.target === OntimeView.Cuesheet;
                return (
                  <tr key={preset.alias}>
                    <td>
                      <Switch
                        checked={preset.enabled}
                        onCheckedChange={(enabled) => persistPreset({ ...preset, enabled })}
                        disabled={isMutating}
                        aria-label='Toggle preset enabled'
                      />
                    </td>
                    <td>
                      {/* cuesheet presets are always reached through a share link, never through the nav */}
                      {isCuesheet ? (
                        <span className={style.notApplicable}>{enDash}</span>
                      ) : (
                        <Switch
                          checked={preset.displayInNav}
                          onCheckedChange={(checked) => persistPreset({ ...preset, displayInNav: checked })}
                          disabled={isMutating}
                          aria-label='Toggle preset in navigation'
                        />
                      )}
                    </td>
                    <td>
                      <Tag>{preset.target}</Tag>
                    </td>
                    <td style={{ width: '100%' }}>{preset.alias}</td>
                    <td>
                      <PresetOptions preset={preset} />
                    </td>
                    <Panel.InlineElements relation='inner' as='td'>
                      <IconButton
                        variant='ghosted-white'
                        onClick={(event) => handleLinks(preset.alias, event)}
                        aria-label='Open in new tab'
                        disabled={isMutating}
                      >
                        <IoOpenOutline />
                      </IconButton>
                      <IconButton
                        onClick={() => openEditForm(preset)}
                        variant='ghosted-white'
                        aria-label='Edit entry'
                        data-testid={`field__edit_${index}`}
                        disabled={isMutating}
                      >
                        <IoPencil />
                      </IconButton>
                      <IconButton
                        onClick={() => deletePreset(preset.alias)}
                        variant='ghosted-destructive'
                        aria-label='Delete entry'
                        data-testid={`field__delete_${index}`}
                        disabled={isMutating}
                      >
                        <IoTrash />
                      </IconButton>
                    </Panel.InlineElements>
                  </tr>
                );
              })}
            </tbody>
          </Panel.Table>
          <ExternalLink href={urlPresetsDocs}>See the docs</ExternalLink>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}

/**
 * Shows the configuration held by a preset.
 * Seeing the parameters is what distinguishes one preset from another.
 */
function PresetOptions({ preset }: { preset: URLPreset }) {
  if (preset.target === OntimeView.Cuesheet) {
    return (
      <Panel.InlineElements relation='inner' wrap='wrap'>
        <Tag>Read: {describePermission(preset.options?.read)}</Tag>
        <Tag>Write: {describePermission(preset.options?.write)}</Tag>
      </Panel.InlineElements>
    );
  }

  if (!preset.search) {
    return <span className={style.notApplicable}>{enDash}</span>;
  }

  return (
    <div className={style.presetParams} title={preset.search}>
      <Panel.Highlight>{preset.search}</Panel.Highlight>
    </div>
  );
}
