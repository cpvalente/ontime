import { URLPreset } from 'ontime-types';
import { useState } from 'react';
import { IoAdd, IoOpenOutline, IoPencil, IoTrash } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Info from '../../../../common/components/info/Info';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import Switch from '../../../../common/components/switch/Switch';
import Tag from '../../../../common/components/tag/Tag';
import useUrlPresets, { useUpdateUrlPreset } from '../../../../common/hooks-query/useUrlPresets';
import { handleLinks } from '../../../../common/utils/linkUtils';
import * as Panel from '../../panel-utils/PanelUtils';
import URLPresetForm from './composite/URLPresetForm';

type FormState = {
  isOpen: boolean;
  preset?: URLPreset;
};

const urlPresetsDocs = 'https://docs.getontime.no/features/url-presets/';

export default function URLPresets() {
  const [formState, setFormState] = useState<FormState>({ isOpen: false, preset: undefined });
  const { data, status } = useUrlPresets();
  const { deletePreset, isMutating } = useUpdateUrlPreset();

  const openNewForm = () => setFormState({ isOpen: true });
  const openEditForm = (preset: URLPreset) => setFormState({ isOpen: true, preset });
  const closeForm = () => setFormState({ isOpen: false, preset: undefined });

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
          <Info>
            URL presets are user pre-defined aliases to Ontime URLs.
            <br />
            This URL can contain full configuration including parameters, or simply route to a specific view.
            <br />
            <br />
            The easiest way to get started is to copy an URL from your browser and paste it into the form.
            <ExternalLink href={urlPresetsDocs}>See the docs</ExternalLink>
          </Info>
        </Panel.Section>
        <Panel.Section>
          <Panel.Loader isLoading={status === 'pending'} />
          {formState.isOpen && <URLPresetForm urlPreset={formState.preset} onClose={closeForm} />}
          <Panel.Table>
            <thead>
              <tr>
                <th>Enabled</th>
                <th>Target view</th>
                <th>Alias</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <Panel.TableEmpty handleClick={openNewForm} />}
              {data.map((preset, index) => {
                return (
                  <tr key={preset.alias}>
                    <td>
                      <Switch defaultChecked={preset.enabled} onCheckedChange={() => {}} />
                    </td>
                    <td>
                      <Tag>{preset.target}</Tag>
                    </td>
                    <td style={{ width: '100%' }}>{preset.alias}</td>
                    <Panel.InlineElements relation='inner' as='td'>
                      <IconButton
                        variant='ghosted-white'
                        onClick={(event) => handleLinks(preset.alias, event)}
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
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
