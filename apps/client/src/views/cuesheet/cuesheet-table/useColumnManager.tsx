import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { ColumnDef, ColumnSizingState, Updater } from '@tanstack/react-table';

import { debounce } from '../../../common/utils/debounce';
import { makeStageKey } from '../../../common/utils/localStorage';
import type { ExtendedEntry } from '../../../common/utils/rundownMetadata';

const tableSizesKey = makeStageKey('cuesheet-sizes');
const tableHiddenKey = makeStageKey('cuesheet-hidden');
const tableOrderKey = makeStageKey('cuesheet-order');

const saveSizesToStorage = debounce((sizes: Record<string, number>) => {
  localStorage.setItem(tableSizesKey, JSON.stringify(sizes));
}, 500);

export function useColumnSizes() {
  const [columnSizing, setColumnSizingState] = useState<Record<string, number>>(() => {
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

  const setColumnSizing = useCallback((sizesOrUpdater: Updater<ColumnSizingState>) => {
    setColumnSizingState(sizesOrUpdater);
  }, []);

  return {
    columnSizing,
    setColumnSizing,
  };
}

export function useColumnOrder(columns: ColumnDef<ExtendedEntry>[]) {
  const [columnOrder, saveColumnOrder] = useLocalStorage<string[]>({
    key: tableOrderKey,
    defaultValue: columns.map((col) => col.id as string),
  });

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
    columnOrder,
    saveColumnOrder,
    resetColumnOrder,
  };
}

export function useColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useLocalStorage({
    key: tableHiddenKey,
    defaultValue: {},
  });

  return {
    columnVisibility,
    setColumnVisibility,
  };
}
