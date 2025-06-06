import { useState } from 'react';
import { IoPencil, IoTrash } from 'react-icons/io5';
import { IconButton } from '@chakra-ui/react';
import { CustomField, CustomFieldKey } from 'ontime-types';

import CopyTag from '../../../../../common/components/copy-tag/CopyTag';
import Swatch from '../../../../../common/components/input/colour-input/Swatch';
import Tag from '../../../../../common/components/tag/Tag';
import * as Panel from '../../../panel-utils/PanelUtils';

import CustomFieldForm from './CustomFieldForm';

import style from '../FeatureSettings.module.scss';

interface CustomFieldEntryProps {
  colour: string;
  label: string;
  fieldKey: string;
  type: 'string' | 'image';
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
        <CopyTag label='Copy key to use in integrations' copyValue={fieldKey}>
          {fieldKey}
        </CopyTag>
      </td>
      <Panel.InlineElements relation='inner' as='td'>
        <IconButton
          size='sm'
          variant='ontime-ghosted'
          color='#e2e2e2' // $gray-200
          icon={<IoPencil />}
          aria-label='Edit entry'
          onClick={() => setIsEditing(true)}
        />
        <IconButton
          size='sm'
          variant='ontime-ghosted'
          color='#FA5656' // $red-500
          icon={<IoTrash />}
          aria-label='Delete entry'
          onClick={() => onDelete(fieldKey)}
        />
      </Panel.InlineElements>
    </tr>
  );
}
