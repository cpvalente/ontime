import { useMemo, useState } from 'react';
import { Button } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { defaultImportMap, ImportMap } from 'ontime-utils';

import * as Panel from '../../PanelUtils';

import ImportMapCustomRow from './ImportMapCustomRow';
import ImportMapRow from './ImportMapRow';

export type TableEntry = { label: string; ontimeName: keyof ImportMap; importName: string };

interface ImportMapTableProps {
  importOptions: ImportMap;
  updateOptions: <T extends keyof ImportMap>(field: T, value: ImportMap[T]) => void;
}

// TODO: add type which allows importing blocks
function makeOntimeFields(importOptions: ImportMap): TableEntry[] {
  return [
    { label: 'Worksheet', ontimeName: 'worksheet', importName: importOptions.worksheet },
    { label: 'Start time', ontimeName: 'timeStart', importName: importOptions.timeStart },
    { label: 'End Time', ontimeName: 'timeEnd', importName: importOptions.timeEnd },
    { label: 'Duration', ontimeName: 'duration', importName: importOptions.duration },
    { label: 'Warning Time', ontimeName: 'timeWarning', importName: importOptions.timeWarning },
    { label: 'Danger Time', ontimeName: 'timeDanger', importName: importOptions.timeDanger },
    { label: 'Cue', ontimeName: 'cue', importName: importOptions.cue },
    { label: 'Colour', ontimeName: 'colour', importName: importOptions.colour },
    { label: 'Title', ontimeName: 'title', importName: importOptions.title },
    { label: 'Presenter', ontimeName: 'presenter', importName: importOptions.presenter },
    { label: 'Subtitle', ontimeName: 'subtitle', importName: importOptions.subtitle },
    { label: 'Note', ontimeName: 'note', importName: importOptions.note },
    { label: 'Is Public', ontimeName: 'isPublic', importName: importOptions.isPublic },
    { label: 'Skip', ontimeName: 'skip', importName: importOptions.skip },
    { label: 'Timer Type', ontimeName: 'timerType', importName: importOptions.timerType },
    { label: 'End Action', ontimeName: 'endAction', importName: importOptions.endAction },
  ];
}

export default function ImportMapTable(props: ImportMapTableProps) {
  const { importOptions, updateOptions } = props;
  const [customFields, setCustomFields] = useState<TableEntry[]>([]);

  const ontimeFields = useMemo(() => makeOntimeFields(importOptions), [importOptions]);
  const customFields2 = Object.keys(importOptions).filter((key) => !(key in defaultImportMap));

  const handleDelete = (ontimeName: string) => {
    setCustomFields((prev) => {
      return prev.filter((field) => field.ontimeName !== ontimeName);
    });
  };

  const handleUpdate = (ontimeName: string) => {};

  const addCustomField = () => {
    setCustomFields((prev) => {
      const placeholderName = `custom${prev.length + 1}`;
      return [...prev, { label: placeholderName, ontimeName: placeholderName, value: placeholderName }];
    });
  };

  const handleUpdateCustom = (oldOntimeName: string, ontimeName: string, importName: string) => {
    setCustomFields((prev) => {
      return prev.map((field) => {
        if (field.ontimeName === oldOntimeName) {
          return { ...field, ontimeName, importName };
        }
        return field;
      });
    });
  };

  return (
    <Panel.Table>
      <thead>
        <tr>
          <th>Ontime field</th>
          <th>From spreadsheet name</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {ontimeFields.map((field) => {
          return (
            <ImportMapRow
              key={field.ontimeName}
              label={field.label}
              ontimeName={field.ontimeName}
              importName={field.importName}
              onChange={handleUpdate}
            />
          );
        })}
        {customFields.map((field) => {
          return (
            <ImportMapCustomRow
              key={field.ontimeName}
              ontimeName={field.ontimeName}
              importName={field.importName}
              onChange={handleUpdateCustom}
              onDelete={handleDelete}
            />
          );
        })}
        <tr>
          <td colSpan={99}>
            <Button size='sm' variant='ontime-subtle' leftIcon={<IoAdd />} onClick={addCustomField}>
              Add custom field
            </Button>
          </td>
        </tr>
      </tbody>
    </Panel.Table>
  );
}
