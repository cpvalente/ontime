import { useState, useEffect } from 'react'; // Import useEffect
import { IoAdd } from 'react-icons/io5';
import { CustomField, CustomFieldKey } from 'ontime-types';

// Import CustomFieldWithKey
import { deleteCustomField, editCustomField, postCustomField, CustomFieldWithKey } from '../../../../common/api/customFields';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import useCustomFields from '../../../../common/hooks-query/useCustomFields';
import { customFieldsDocsUrl } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import CustomFieldEntry from './composite/CustomFieldEntry';
import CustomFieldForm from './composite/CustomFieldForm';

export default function CustomFieldSettings() {
  const { data, refetch } = useCustomFields(); // data is CustomFieldWithKey[]
  const [isAdding, setIsAdding] = useState(false);
  const [displayedFields, setDisplayedFields] = useState<CustomFieldWithKey[]>([]);
  const [orderChanged, setOrderChanged] = useState(false); // To track if order has changed for enabling Save button
  const [isSavingOrder, setIsSavingOrder] = useState(false); // For Save Order button loading state

  useEffect(() => {
    // Initialize displayedFields with fetched data, ensuring a fresh copy for local manipulation
    // And sort it initially, as the backend already provides it sorted, but this ensures consistency.
    setDisplayedFields(data ? [...data].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)) : []);
    // When data is refetched from server (e.g. after save), reset orderChanged flag
    setOrderChanged(false);
  }, [data]);

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    const updatePromises = [];

    // Create a map of original orders for quick lookup
    const originalFieldsMap = new Map(data.map(f => [f.key, f]));

    for (let i = 0; i < displayedFields.length; i++) {
      const currentField = displayedFields[i];
      const originalField = originalFieldsMap.get(currentField.key);

      // The new order is its current index in the displayedFields array
      const newOrder = i;

      // Check if the effective order has changed, or if it's a new field without an original order yet (though create handles initial order)
      // or if the field itself is new and not in originalFieldsMap (less likely here as it should have been created)
      if (!originalField || originalField.order !== newOrder) {
        // Only update if the order property is actually different
        // We need to ensure the object passed to editCustomField has all required CustomField props
        // and the order. The 'key' is passed as the first argument to editCustomField.
        const fieldToSave: Partial<CustomField> = {
          label: currentField.label,
          type: currentField.type,
          colour: currentField.colour,
          order: newOrder,
        };
        updatePromises.push(editCustomField(currentField.key, fieldToSave));
      }
    }

    try {
      await Promise.all(updatePromises);
      setOrderChanged(false);
      refetch(); // Refetch data from the server to confirm and get fresh state
    } catch (error) {
      console.error("Error saving custom field order:", error);
      // Potentially show an error message to the user
    } finally {
      setIsSavingOrder(false);
    }
  };

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
          <Panel.InlineElements>
            <Button onClick={handleSaveOrder} variant='primary' disabled={!orderChanged || isSavingOrder} loading={isSavingOrder}>
              Save Order
            </Button>
            <Button onClick={handleInitiateCreate} disabled={isSavingOrder}>
              New <IoAdd />
            </Button>
          </Panel.InlineElements>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Info>
            Custom fields allow for additional information to be added to an event.
            <br />
            <br />
            This data can be used in the Automation feature by using the generated key.
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
                <th>Key (used in Integrations)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {displayedFields.map((field, index) => { // Iterate over displayedFields
                return (
                  <CustomFieldEntry
                    key={field.key}
                    fieldKey={field.key}
                    colour={field.colour}
                    label={field.label}
                    type={field.type}
                    order={field.order} // Pass order
                    onEdit={handleEditField}
                    onDelete={handleDelete}
                    // For reordering
                    isFirst={index === 0}
                    isLast={index === displayedFields.length - 1} // Use displayedFields.length
                    onMove={(direction: 'up' | 'down') => {
                      const newFields = [...displayedFields];
                      const fieldToMove = newFields[index];
                      let neighborIndex = -1;

                      if (direction === 'up' && index > 0) {
                        neighborIndex = index - 1;
                      } else if (direction === 'down' && index < newFields.length - 1) {
                        neighborIndex = index + 1;
                      }

                      if (neighborIndex !== -1) {
                        const neighborField = newFields[neighborIndex];

                        // Swap order properties
                        const tempOrder = fieldToMove.order;
                        fieldToMove.order = neighborField.order;
                        neighborField.order = tempOrder;

                        // Actual swap in the array for immediate UI feedback before potential sort
                        newFields[index] = neighborField;
                        newFields[neighborIndex] = fieldToMove;

                        // Sort by the new order values to ensure dense packing if orders were sparse or undefined
                        // This also handles cases where initial orders might not be perfectly sequential.
                        newFields.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));

                        // If orders became non-dense or undefined, re-assign dense orders
                        // This ensures that when we save, we send a clean, sequential order.
                        let orderIsDirty = false;
                        newFields.forEach((f, i) => {
                          if(f.order !== i) {
                            f.order = i;
                            orderIsDirty = true;
                          }
                        });

                        // If we had to re-assign orders, sort again just in case (though should be sorted)
                        if(orderIsDirty) {
                            newFields.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
                        }


                        setDisplayedFields(newFields);
                        setOrderChanged(true);
                      }
                    }}
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
