import { Input } from '@chakra-ui/react';

import { ExcelInputOptions } from '../UploadModal';

import style from './ImportMapTable.module.scss';

// TODO: make this generic
export type TableEntry = { label: string; title: keyof ExcelInputOptions; value: string };

interface ImportMapTableProps {
  title: string;
  fields: TableEntry[];
  handleOnChange: (field: keyof ExcelInputOptions, value: string) => void;
}

export default function ImportMapTable(props: ImportMapTableProps) {
  const { title, fields, handleOnChange } = props;

  return (
    <table className={style.importTable}>
      <thead>{title}</thead>
      <tbody>
        {fields.map((field) => {
          return (
            <tr key={field.title}>
              <td>
                <label className={style.label} htmlFor={field.title}>
                  {field.title}
                </label>
              </td>
              <td>
                <Input
                  id={field.title}
                  size='xs'
                  variant='ontime-filled-on-light'
                  maxLength={25}
                  defaultValue={field.value}
                  placeholder='Use default column name'
                  onBlur={(event) => {
                    handleOnChange(field.title, event.target.value);
                  }}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
