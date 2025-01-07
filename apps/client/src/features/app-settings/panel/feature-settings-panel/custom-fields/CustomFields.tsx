import { useState } from 'react';
import { IoAdd } from 'react-icons/io5';
import { CustomField, CustomFieldLabel } from 'ontime-types';

import { deleteCustomField, editCustomField, postCustomField } from '../../../../../common/api/customFields';
import ExternalLink from '../../../../../common/components/external-link/ExternalLink';
import { Alert } from '../../../../../common/components/ui/alert';
import { Button } from '../../../../../common/components/ui/button';
import useCustomFields from '../../../../../common/hooks-query/useCustomFields';
import { customFieldsDocsUrl } from '../../../../../externals';
import * as Panel from '../../../panel-utils/PanelUtils';

import CustomFieldEntry from './CustomFieldEntry';
import CustomFieldForm from './CustomFieldForm';

export default function CustomFields() {
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
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>
          Custom fields
          <Button variant='ontime-subtle' size='sm' onClick={handleInitiateCreate}>
            New <IoAdd />
          </Button>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Alert
            status='info'
            title={
              <>
                Custom fields allow for additional information to be added to an event.
                <br />
                <br />
                This data is not used by Ontime, but provides place for cueing or department specific information (eg.
                light, sound, camera).
                <br />
                <br />
                Custom fields can be used width the Integrations feature using the generated key.
                <ExternalLink href={customFieldsDocsUrl}>See the docs</ExternalLink>
              </>
            }
          />
        </Panel.Section>
        <Panel.Section>
          {isAdding && <CustomFieldForm onSubmit={handleCreate} onCancel={handleCancel} />}
          <Panel.Table>
            <thead>
              <tr>
                <th>Colour</th>
                <th>Name</th>
                <th>Key (used in Integrations)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, { colour, label }]) => {
                return (
                  <CustomFieldEntry
                    key={key}
                    field={key}
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
  );
}
