import { useState } from 'react';
import { IoArrowDown, IoArrowUp, IoPencil, IoTrash } from 'react-icons/io5';
import { CustomField, CustomFieldKey } from 'ontime-types';

import IconButton from '../../../../../common/components/buttons/IconButton';
import CopyTag from '../../../../../common/components/copy-tag/CopyTag';
import Swatch from '../../../../../common/components/input/colour-input/Swatch';
import Tag from '../../../../../common/components/tag/Tag';
import * as Panel from '../../../panel-utils/PanelUtils';

import CustomFieldForm from './CustomFieldForm';

import style from '../ManagePanel.module.scss';

interface CustomFieldEntryProps {
  colour: string;
  label: string;
  fieldKey: string;
  type: 'string' | 'image';
  order?: number; // Add order
  onEdit: (key: CustomFieldKey, patch: Partial<CustomField>) => Promise<void>; // Patch can be partial for order updates
  onDelete: (key: CustomFieldKey) => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: 'up' | 'down') => void; // Changed from Promise<void> to void
}

export default function CustomFieldEntry(props: CustomFieldEntryProps) {
  const { colour, label, fieldKey, type, onEdit, onDelete, isFirst, isLast, onMove } = props;
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async (patch: CustomField) => { // This patch comes from CustomFieldForm, so it's a full CustomField
    await onEdit(fieldKey, patch);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr>
        <td colSpan={99}>
          <CustomFieldForm
            onCancel={() => setIsEditing(false)}
            onSubmit={handleEdit}
            initialColour={colour}
            initialLabel={label}
            initialKey={fieldKey}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <Swatch color={colour} />
      </td>
      <td>
        <Tag>{type}</Tag>
      </td>
      <td className={style.halfWidth}>{label}</td>
      <td className={style.fullWidth}>
        <CopyTag label='Copy key to use in integrations' copyValue={fieldKey}>
          {fieldKey}
        </CopyTag>
      </td>
      <Panel.InlineElements relation='inner' as='td'>
        <IconButton variant='ghosted-white' aria-label='Move field up' onClick={() => onMove('up')} disabled={isFirst}>
          <IoArrowUp />
        </IconButton>
        <IconButton variant='ghosted-white' aria-label='Move field down' onClick={() => onMove('down')} disabled={isLast}>
          <IoArrowDown />
        </IconButton>
        <IconButton variant='ghosted-white' aria-label='Edit entry' onClick={() => setIsEditing(true)}>
          <IoPencil />
        </IconButton>
        <IconButton variant='ghosted-destructive' aria-label='Delete entry' onClick={() => onDelete(fieldKey)}>
          <IoTrash />
        </IconButton>
      </Panel.InlineElements>
    </tr>
  );
}
