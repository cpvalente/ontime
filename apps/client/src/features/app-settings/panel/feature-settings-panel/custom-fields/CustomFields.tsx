import { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { CustomField, CustomFieldLabel } from 'ontime-types';

import { deleteCustomField, editCustomField, postCustomField } from '../../../../../common/api/customFields';
import ExternalLink from '../../../../../common/components/external-link/ExternalLink';
import Info from '../../../../../common/components/info/Info';
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
          <Button variant='ontime-subtle' rightIcon={<IoAdd />} size='sm' onClick={handleInitiateCreate}>
            New
          </Button>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Info>
            Custom fields allow for additional information to be added to an event.
            <br />
            <br />
            This data is not used by Ontime, but provides place for cueing or department specific information (eg.
            light, sound, camera).
            <br />
            <br />
            Custom fields can be used width the Integrations feature using the generated key.
            <ExternalLink href={customFieldsDocsUrl}>See the docs</ExternalLink>
          </Info>
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
