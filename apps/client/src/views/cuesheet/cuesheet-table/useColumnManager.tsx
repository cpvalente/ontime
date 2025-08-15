import { useCallback, useEffect } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { ColumnDef } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

import { baseURI } from '../../../externals';

export default function useColumnManager(columns: ColumnDef<OntimeRundownEntry>[]) {
  const [columnVisibility, setColumnVisibility] = useLocalStorage({ key: `${baseURI}table-hidden`, defaultValue: {} });
  const [columnOrder, saveColumnOrder] = useLocalStorage<string[]>({
    key: `${baseURI}table-order`,
    defaultValue: columns.map((col) => col.id as string),
  });
  const [columnSizing, setColumnSizing] = useLocalStorage({
    key: `${baseURI}table-sizes`,
    defaultValue: {},
  });

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
