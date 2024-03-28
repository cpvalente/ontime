import { useState } from 'react';
import { IconButton } from '@chakra-ui/react';
import { IoPencil } from '@react-icons/all-files/io5/IoPencil';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { CustomField, CustomFieldLabel } from 'ontime-types';

import Swatch from '../../../../common/components/input/colour-input/Swatch';

import CustomFieldForm from './CustomFieldForm';

import style from './ProjectSettingsPanel.module.scss';

interface CustomFieldEntryProps {
  backEndKey: string;
  colour: string;
  label: string;
  onEdit: (label: CustomFieldLabel, patch: CustomField) => Promise<void>;
  onDelete: (label: CustomFieldLabel) => Promise<void>;
}

export default function CustomFieldEntry(props: CustomFieldEntryProps) {
  const { colour, label, onEdit, onDelete, backEndKey } = props;
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async (patch: CustomField) => {
    await onEdit(backEndKey, patch);
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
      <td className={style.fullWidth}>{label}</td>
      <td className={style.actions}>
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
          onClick={() => onDelete(backEndKey)}
        />
      </td>
    </tr>
  );
}
