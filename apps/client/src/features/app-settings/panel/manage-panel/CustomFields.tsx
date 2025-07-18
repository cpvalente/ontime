import { useState } from 'react';
import { IoAdd } from 'react-icons/io5';
import { CustomField, CustomFieldKey } from 'ontime-types';

import { deleteCustomField, editCustomField, postCustomField } from '../../../../common/api/customFields';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import AppLink from '../../../../common/components/link/app-link/AppLink';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import useCustomFields from '../../../../common/hooks-query/useCustomFields';
import { customFieldsDocsUrl } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import CustomFieldEntry from './composite/CustomFieldEntry';
import CustomFieldForm from './composite/CustomFieldForm';

export default function CustomFieldSettings() {
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

  const handleEditField = async (key: CustomFieldKey, customField: CustomField) => {
    await editCustomField(key, customField);
    refetch();
  };

  const handleDelete = async (key: CustomFieldKey) => {
    try {
      await deleteCustomField(key);
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
          <Button onClick={handleInitiateCreate}>
            New <IoAdd />
          </Button>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Info>
            Custom fields allow for additional information to be added to an event.
            <br />
            <br />
            To use custom fields as a data source in an{' '}
            <AppLink search='settings=automation__automations'>Automation</AppLink>, please note the generated key.
            <ExternalLink href={customFieldsDocsUrl}>See the docs</ExternalLink>
          </Info>
        </Panel.Section>
        <Panel.Section>
          {isAdding && <CustomFieldForm onSubmit={handleCreate} onCancel={handleCancel} />}
          <Panel.Table>
            <thead>
              <tr>
                <th>Colour</th>
                <th>Type</th>
                <th>Name</th>
                <th>Key (used in Automations)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, { colour, label, type }]) => {
                return (
                  <CustomFieldEntry
                    key={key}
                    fieldKey={key}
                    colour={colour}
                    label={label}
                    type={type}
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
