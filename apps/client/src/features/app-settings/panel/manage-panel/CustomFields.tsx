import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, type SortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CustomField, CustomFieldKey, NewCustomField } from 'ontime-types';
import { useState } from 'react';
import { IoAdd } from 'react-icons/io5';

import { deleteCustomField, editCustomField, postCustomField } from '../../../../common/api/customFields';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import AppLink from '../../../../common/components/link/app-link/AppLink';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import useCustomFields, { useReorderCustomFields } from '../../../../common/hooks-query/useCustomFields';
import { customFieldsDocsUrl } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';
import CustomFieldEntry from './composite/CustomFieldEntry';
import CustomFieldForm from './composite/CustomFieldForm';

type FormState = {
  isOpen: boolean;
  field?: CustomField;
};

export default function CustomFieldSettings() {
  const { data: customFields, refetch } = useCustomFields();
  const reorder = useReorderCustomFields();
  const [formState, setFormState] = useState<FormState>({ isOpen: false, field: undefined });
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const openNewForm = () => setFormState({ isOpen: true });
  const openEditForm = (field: CustomField) => setFormState({ isOpen: true, field });
  const closeForm = () => setFormState({ isOpen: false, field: undefined });

  const handleSubmit = async (customField: NewCustomField) => {
    const editing = formState.field;
    if (editing) {
      await editCustomField(editing.key, { label: customField.label, colour: customField.colour });
    } else {
      await postCustomField(customField);
    }
    refetch();
    closeForm();
  };

  const handleDelete = async (key: CustomFieldKey) => {
    try {
      setError(null);
      await deleteCustomField(key);
      refetch();
    } catch (deleteError) {
      setError(`Could not delete the custom field: ${maybeAxiosError(deleteError)}`);
    }
  };

  const order = customFields.map((field) => field.key);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const fromIndex = order.indexOf(String(active.id));
    const toIndex = order.indexOf(String(over.id));
    if (fromIndex === -1 || toIndex === -1) return;
    setError(null);
    reorder(arrayMove(order, fromIndex, toIndex), {
      onError: () => setError('Could not save the new order, so the previous order was restored.'),
    });
  };

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
              Drag the handle to reorder fields, or focus it and use Space and the arrow keys. This sets their order in
              the entry editor and the default cuesheet column order.
            </span>
            <span>
              To use custom fields as a data source in an{' '}
              <AppLink search='settings=automation__automations'>Automation</AppLink>, please note the generated key.
            </span>
            <ExternalLink href={customFieldsDocsUrl}>See the docs</ExternalLink>
          </Info>
        </Panel.Section>
        <Panel.Section>
          {error && <Panel.Error>{error}</Panel.Error>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Panel.Table>
              <thead>
                <tr>
                  <th aria-label='Order' />
                  <th>Colour</th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Key (used in Automations)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {customFields.length === 0 && (
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
                <SortableContext items={order} strategy={noSortingStrategy}>
                  {customFields.map((field) => {
                    return (
                      <CustomFieldEntry
                        key={field.key}
                        fieldKey={field.key}
                        colour={field.colour}
                        label={field.label}
                        type={field.type}
                        onEdit={() => openEditForm(field)}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </SortableContext>
              </tbody>
            </Panel.Table>
          </DndContext>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}

// Keep rows static; the insertion line indicates the destination.
const noSortingStrategy: SortingStrategy = () => null;
