import { IconButton, Input } from '@chakra-ui/react';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';

interface ImportMapCustomRowProps {
  ontimeName: string;
  importName: string;
  onChange: (oldOntimeName: string, ontimeName: string, importName: string) => void;
  onDelete: (ontimeName: string) => void;
}

export default function ImportMapCustomRow(props: ImportMapCustomRowProps) {
  const { ontimeName, importName, onChange, onDelete } = props;

  const handleUpdate = (field: 'importName' | 'ontimeName', newFieldValue: string) => {
    if (field === 'ontimeName') {
      onChange(ontimeName, newFieldValue, importName);
      return;
    }

    if (field === 'importName') {
      onChange(ontimeName, ontimeName, newFieldValue);
    }
  };

  return (
    <tr>
      <td>
        <Input
          size='sm'
          variant='ontime-filled'
          maxLength={25}
          defaultValue={ontimeName}
          placeholder='Name of the field as shown in Ontime'
          onBlur={(event) => {
            handleUpdate('ontimeName', event.target.value);
          }}
        />
      </td>
      <td>
        <Input
          size='sm'
          variant='ontime-filled'
          maxLength={25}
          defaultValue={importName}
          placeholder='Name of the column in the spreadsheet'
          onBlur={(event) => {
            handleUpdate('importName', event.target.value);
          }}
        />
      </td>
      <td>
        <IconButton aria-label='Delete' size='sm' icon={<IoTrash />} onClick={() => onDelete(ontimeName)} />
      </td>
    </tr>
  );
}
