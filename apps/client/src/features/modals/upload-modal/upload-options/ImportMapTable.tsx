import { Input } from '@chakra-ui/react';
import { ExcelImportMap } from 'ontime-utils';

import style from './ImportMapTable.module.scss';

export type TableEntry = { label: string; title: keyof ExcelImportMap; value: string };

interface ImportMapTableProps {
  title: string;
  fields: TableEntry[];
  handleOnChange: (field: keyof ExcelImportMap, value: string) => void;
}

export default function ImportMapTable(props: ImportMapTableProps) {
  const { title, fields, handleOnChange } = props;

  return (
    <table className={style.importTable}>
      <thead>
        <tr>
          <td colSpan={2}>{title}</td>
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => {
          return (
            <tr key={field.title}>
              <td className={style.label}>
                <label htmlFor={field.title}>{field.label}</label>
              </td>
              <td className={style.input}>
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
