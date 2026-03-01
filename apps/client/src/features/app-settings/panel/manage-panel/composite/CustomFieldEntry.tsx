import { CustomField, CustomFieldKey } from 'ontime-types';
import { useState } from 'react';
import { IoPencil, IoTrash } from 'react-icons/io5';

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
  type: CustomField['type'];
  onEdit: (key: CustomFieldKey, patch: CustomField) => Promise<void>;
  onDelete: (key: CustomFieldKey) => Promise<void>;
}

export default function CustomFieldEntry(props: CustomFieldEntryProps) {
  const { colour, label, fieldKey, type, onEdit, onDelete } = props;
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async (patch: CustomField) => {
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
        <CopyTag size='small' copyValue={fieldKey}>
          {fieldKey}
        </CopyTag>
      </td>
      <Panel.InlineElements relation='inner' as='td'>
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
