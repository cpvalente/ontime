import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { ColumnDef } from '@tanstack/react-table';
import { OntimeEntry } from 'ontime-types';

import { debounce } from '../../../common/utils/debounce';
import { makeStageKey } from '../../../common/utils/localStorage';

const tableSizesKey = makeStageKey('cuesheet-sizes');
const tableHiddenKey = makeStageKey('cuesheet-hidden');
const tableOrderKey = makeStageKey('cuesheet-order');

const saveSizesToStorage = debounce((sizes: Record<string, number>) => {
  localStorage.setItem(tableSizesKey, JSON.stringify(sizes));
}, 500);

export default function useColumnManager(columns: ColumnDef<OntimeEntry>[]) {
  const [columnVisibility, setColumnVisibility] = useLocalStorage({
    key: tableHiddenKey,
    defaultValue: {},
  });
  const [columnOrder, saveColumnOrder] = useLocalStorage<string[]>({
    key: tableOrderKey,
    defaultValue: columns.map((col) => col.id as string),
  });

  const [columnSizing, setColumnSizingState] = useState(() => {
    try {
      const stored = localStorage.getItem(tableSizesKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // save sizes to localStorage whenever they change (debounced)
  useEffect(() => {
    saveSizesToStorage(columnSizing);
  }, [columnSizing]);

  const setColumnSizing = useCallback((sizes: typeof columnSizing) => {
    setColumnSizingState(sizes);
  }, []);

  // update column order if columns change
  useEffect(() => {
    const newColumns = columns.map((col) => col.id as string);
    if (newColumns.some((id) => !columnOrder.includes(id))) {
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
