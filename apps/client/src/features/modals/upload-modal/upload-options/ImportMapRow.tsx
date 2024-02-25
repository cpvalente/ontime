import { Input } from '@chakra-ui/react';

interface ImportMapRowProps {
  label: string;
  ontimeName: string;
  importName: string;
  onChange: (ontimeName: string, value: string) => void;
}

export default function ImportMapRow(props: ImportMapRowProps) {
  const { label, ontimeName, importName, onChange } = props;

  return (
    <tr>
      <td>{label}</td>
      <td>
        <Input
          id={ontimeName}
          size='sm'
          variant='ontime-filled'
          maxLength={25}
          defaultValue={importName}
          placeholder='Use default column name'
          onBlur={(event) => {
            onChange(ontimeName, event.target.value);
          }}
        />
      </td>
      <td />
    </tr>
  );
}
