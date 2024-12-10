import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocalStorage } from '@mantine/hooks';
import { ColumnDef } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

// TODO: persist column order to params

export default function useColumnManager(columns: ColumnDef<OntimeRundownEntry>[]) {
  const [columnVisibility, setColumnVisibility] = useLocalStorage({ key: 'table-hidden', defaultValue: {} });
  const [columnOrder, saveColumnOrder] = useLocalStorage<string[]>({
    key: 'table-order',
    defaultValue: columns.map((col) => col.id as string),
  });
  const [columnSizing, setColumnSizing] = useLocalStorage({ key: 'table-sizes', defaultValue: {} });
  const [_, setSearchParams] = useSearchParams();

  // if the columns change, we update the dataset
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
      const columns = newColumns.join(',');
      const searchParams = new URLSearchParams();
      searchParams.set('columns', columns);
      setSearchParams(searchParams);
    }
  }, [columnOrder, columns, saveColumnOrder, setSearchParams]);

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
