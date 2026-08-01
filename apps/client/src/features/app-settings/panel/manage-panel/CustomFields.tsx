import { CustomField, CustomFieldKey } from 'ontime-types';
import { useState } from 'react';
import { IoAdd } from 'react-icons/io5';

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

type CustomFieldEntity = CustomField & { key: CustomFieldKey };

type FormState = {
  isOpen: boolean;
  field?: CustomFieldEntity;
};

export default function CustomFieldSettings() {
  const { data, refetch } = useCustomFields();
  const [formState, setFormState] = useState<FormState>({ isOpen: false, field: undefined });

  const openNewForm = () => setFormState({ isOpen: true });
  const openEditForm = (field: CustomFieldEntity) => setFormState({ isOpen: true, field });
  const closeForm = () => setFormState({ isOpen: false, field: undefined });

  const handleSubmit = async (customField: CustomField) => {
    const editing = formState.field;
    if (editing) {
      await editCustomField(editing.key, customField);
    } else {
      await postCustomField(customField);
    }
    refetch();
    closeForm();
  };

  const handleDelete = async (key: CustomFieldKey) => {
    try {
      await deleteCustomField(key);
      refetch();
    } catch (_error) {
      /** we do not handle errors here */
    }
  };

  const entries = Object.entries(data);

  return (
    <Panel.Section>
      <Panel.Card>
        {formState.isOpen && (
          <CustomFieldForm
            onSubmit={handleSubmit}
            onCancel={closeForm}
            initialColour={formState.field?.colour}
            initialLabel={formState.field?.label}
            initialKey={formState.field?.key}
            initialType={formState.field?.type}
          />
        )}
        <Panel.SubHeader>
          Custom fields
          <Button onClick={openNewForm}>
            New <IoAdd />
          </Button>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Info>
            <span>Custom fields allow for additional information to be added to an event.</span>
            <span>
              To use custom fields as a data source in an{' '}
              <AppLink search='settings=automation__automations'>Automation</AppLink>, please note the generated key.
            </span>
            <ExternalLink href={customFieldsDocsUrl}>See the docs</ExternalLink>
          </Info>
        </Panel.Section>
        <Panel.Section>
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
              {entries.length === 0 && (
                <Panel.TableEmpty
                  title='No custom fields yet'
                  description='Custom fields add your own columns to the rundown, and can be shown in views or used in automations.'
                  action={
                    <Button variant='primary' onClick={openNewForm}>
                      Create custom field <IoAdd />
                    </Button>
                  }
                />
              )}
              {entries.map(([key, { colour, label, type }]) => {
                return (
                  <CustomFieldEntry
                    key={key}
                    fieldKey={key}
                    colour={colour}
                    label={label}
                    type={type}
                    onEdit={() => openEditForm({ key, colour, label, type })}
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
