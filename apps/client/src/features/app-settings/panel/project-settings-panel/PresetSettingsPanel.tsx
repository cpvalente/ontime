import { useState } from 'react';
import { Alert, AlertDescription, AlertIcon, Button } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { PresetEvent } from 'ontime-types';

import { deletePresetEvent, editPresetEvent, postPresetEvent } from '../../../../common/api/presetEvents';
import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import usePresetEvents from '../../../../common/hooks-query/usePresetEvents';
import * as Panel from '../PanelUtils';

import PresetEventEntry from './PresetEventEntry';
import PresetEventForm from './PresetEventForm';

const customFieldsDocsUrl = 'https://docs.getontime.no/features/custom-fields/';

export default function PresetSettingsPanel() {
  const { data, refetch } = usePresetEvents();
  const [isAdding, setIsAdding] = useState(false);

  const handleInitiateCreate = () => {
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
  };

  const handleCreate = async (presetEvent: PresetEvent) => {
    await postPresetEvent(presetEvent);
    refetch();
    setIsAdding(false);
  };

  const handleEditField = async (label: string, presetEvent: PresetEvent) => {
    await editPresetEvent(label, presetEvent);
    refetch();
  };

  const handleDelete = async (label: string) => {
    try {
      await deletePresetEvent(label);
      refetch();
    } catch (_error) {
      /** we do not handle errors here */
    }
  };

  return (
    <>
      <Panel.Header>Preset Settings</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>
            Preset Events
            <Button variant='ontime-subtle' rightIcon={<IoAdd />} size='sm' onClick={handleInitiateCreate}>
              New
            </Button>
          </Panel.SubHeader>
          <Panel.Divider />
          <Panel.Section>
            <Alert status='info' variant='ontime-on-dark-info'>
              <AlertIcon />
              <AlertDescription>
                TODO: change Custom fields allow for additional information to be added to an event (eg. light, sound,
                <br />
                <br />
                This data is not used by Ontime.
                <ExternalLink href={customFieldsDocsUrl}>See the docs</ExternalLink>
              </AlertDescription>
            </Alert>
          </Panel.Section>
          <Panel.Section>
            {isAdding && <PresetEventForm onSubmit={handleCreate} onCancel={handleCancel} />}
            <Panel.Table>
              <thead>
              <tr>
                <th>Label</th>
                <th>Cue</th>
                <th>Title</th>
                <th>Colour</th>
                <th>Note</th>
                <th />
              </tr>
              </thead>
              <tbody>
                {Object.entries(data).map(([key, preset]) => {
                  return (
                    <PresetEventEntry
                      key={key}
                      label={preset.label}
                      preset={preset}
                      onEdit={handleEditField}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </tbody>
            </Panel.Table>
          </Panel.Section>
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
