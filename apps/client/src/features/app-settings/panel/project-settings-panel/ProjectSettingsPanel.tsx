import { useState } from 'react';
import { Alert, Button } from '@mantine/core';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { CustomField, CustomFieldLabel } from 'ontime-types';

import { deleteCustomField, editCustomField, postCustomField } from '../../../../common/api/customFields';
import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import useCustomFields from '../../../../common/hooks-query/useCustomFields';
import * as Panel from '../PanelUtils';

import CustomFieldEntry from './CustomFieldEntry';
import CustomFieldForm from './CustomFieldForm';
import { IoAlertCircleOutline } from '@react-icons/all-files/io5/IoAlertCircleOutline';

const customFieldsDocsUrl = 'https://docs.getontime.no/features/custom-fields/';

export default function ProjectSettingsPanel() {
  const { data, refetch } = useCustomFields();
  const [isAdding, setIsAdding] = useState(false);

  const handleInitiateCreate = () => {
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
  };

  const handleCreate = async (customField: CustomField) => {
    await postCustomField(customField);
    refetch();
    setIsAdding(false);
  };

  const handleEditField = async (label: CustomFieldLabel, customField: CustomField) => {
    await editCustomField(label, customField);
    refetch();
  };

  const handleDelete = async (label: string) => {
    try {
      await deleteCustomField(label);
      refetch();
    } catch (_error) {
      /** we do not handle errors here */
    }
  };

  return (
    <>
      <Panel.Header>Project Settings</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>
            Custom fields
            <Button variant='ontime-subtle' rightSection={<IoAdd />} size='sm' onClick={handleInitiateCreate}>
              New
            </Button>
          </Panel.SubHeader>
          <Panel.Divider />
          <Panel.Section>
            <Alert color='blue' icon={<IoAlertCircleOutline />}>
              Custom fields allow for additional information to be added to an event (eg. light, sound, camera). <br />
              <br />
              This data is not used by Ontime.
              <ExternalLink href={customFieldsDocsUrl}>See the docs</ExternalLink>
            </Alert>
          </Panel.Section>
          <Panel.Section>
            {isAdding && <CustomFieldForm onSubmit={handleCreate} onCancel={handleCancel} />}
            <Panel.Table>
              <thead>
                <tr>
                  <th>Colour</th>
                  <th>Name</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {Object.entries(data).map(([key, { colour, label }]) => {
                  return (
                    <CustomFieldEntry
                      key={key}
                      colour={colour}
                      label={label}
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
