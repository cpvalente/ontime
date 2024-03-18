import { useState } from 'react';
import { IconButton } from '@chakra-ui/react';
import { IoPencil } from '@react-icons/all-files/io5/IoPencil';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { PresetEvent } from 'ontime-types';

import Swatch from '../../../../common/components/input/colour-input/Swatch';

import PresetEventForm from './PresetEventForm';

import style from './ProjectSettingsPanel.module.scss';

interface PresetEventEntryProps {
  label: string;
  preset: PresetEvent;
  onEdit: (label: string, patch: PresetEvent) => Promise<void>;
  onDelete: (label: string) => Promise<void>;
}

export default function PresetEventEntry(props: PresetEventEntryProps) {
  const { label, onEdit, onDelete, preset } = props;

  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async (patch: PresetEvent) => {
    const oldLabel = label;
    await onEdit(oldLabel, patch);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr>
        <td colSpan={99}>
          <PresetEventForm
            onCancel={() => setIsEditing(false)}
            onSubmit={handleEdit}
            initialPreset={preset}
            initialLabel={label}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{label}</td>
      <td>{preset.cue}</td>
      <td>{preset.title}</td>
      <td>
        <Swatch color={preset.colour ?? ''} />
      </td>
      <td>{preset.note}</td>
      <td className={style.actions}>
        <IconButton
          size="sm"
          variant="ontime-ghosted"
          color="#e2e2e2" // $gray-200
          icon={<IoPencil />}
          aria-label="Edit entry"
          onClick={() => setIsEditing(true)}
        />
        <IconButton
          size="sm"
          variant="ontime-ghosted"
          color="#FA5656" // $red-500
          icon={<IoTrash />}
          aria-label="Delete entry"
          onClick={() => onDelete(label)}
        />
      </td>
    </tr>
  );
}
