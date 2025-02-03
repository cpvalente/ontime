import { useState } from 'react';
import { IconButton } from '@chakra-ui/react';
import { IoPencil } from '@react-icons/all-files/io5/IoPencil';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { CustomField, CustomFieldLabel } from 'ontime-types';

import CopyTag from '../../../../../common/components/copy-tag/CopyTag';
import Swatch from '../../../../../common/components/input/colour-input/Swatch';
import * as Panel from '../../../panel-utils/PanelUtils';

import CustomFieldForm from './CustomFieldForm';

import style from '../FeatureSettings.module.scss';

interface CustomFieldEntryProps {
  field: string;
  colour: string;
  label: string;
  onEdit: (label: CustomFieldLabel, patch: CustomField) => Promise<void>;
  onDelete: (label: CustomFieldLabel) => Promise<void>;
}

export default function CustomFieldEntry(props: CustomFieldEntryProps) {
  const { colour, label, onEdit, onDelete, field } = props;
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async (patch: CustomField) => {
    await onEdit(field, patch);
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
            initialKey={field}
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
      <td className={style.halfWidth}>{label}</td>
      <td className={style.fullWidth}>
        <CopyTag label='Copy key to use in integrations' copyValue={field}>
          {field}
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
          onClick={() => onDelete(field)}
        />
      </Panel.InlineElements>
    </tr>
  );
}
