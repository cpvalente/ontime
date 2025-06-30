import { useCallback, useEffect } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { ColumnDef } from '@tanstack/react-table';
import { OntimeEntry } from 'ontime-types';

export default function useColumnManager(columns: ColumnDef<OntimeEntry>[]) {
  const [columnVisibility, setColumnVisibility] = useLocalStorage({ key: 'table-hidden', defaultValue: {} });
  const [columnOrder, saveColumnOrder] = useLocalStorage<string[]>({
    key: 'table-order',
    defaultValue: columns.map((col) => col.id as string),
  });
  const [columnSizing, setColumnSizing] = useLocalStorage({ key: 'table-sizes', defaultValue: {} });

  // if the columns order changes, we update the dataset
  useEffect(() => {
    let shouldReplace = false;
    const newColumns: string[] = [];

    // iterate through columns to see if there are new ids
    columns.forEach((column) => {
      const columnnId = column.id as string;
      if (!shouldReplace && !columnOrder.includes(columnnId)) {
        shouldReplace = true;
      }
      newColumns.push(columnnId);
    });

    if (shouldReplace) {
      saveColumnOrder(newColumns);
    }
  }, [columnOrder, columns, saveColumnOrder]);

  const resetColumnOrder = useCallback(() => {
    saveColumnOrder(columns.map((col) => col.id as string));
  }, [columns, saveColumnOrder]);

  return {
    columnVisibility,
    columnOrder,
    columnSizing,
    resetColumnOrder,
    setColumnVisibility,
    saveColumnOrder,
    setColumnSizing,
  };
}
