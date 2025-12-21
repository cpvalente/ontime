import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { ColumnDef, ColumnSizingState, Updater } from '@tanstack/react-table';

import { debounce } from '../../../common/utils/debounce';
import { makeStageKey } from '../../../common/utils/localStorage';
import type { ExtendedEntry } from '../../../common/utils/rundownMetadata';

type TableRoot = 'editor' | 'cuesheet';

export function useColumnSizes(tableRoot: TableRoot = 'cuesheet') {
  const tableSizesKey = useMemo(() => makeStageKey(`${tableRoot}-table-sizes`), [tableRoot]);

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
    const saveSizesToStorage = debounce((sizes: Record<string, number>) => {
      localStorage.setItem(tableSizesKey, JSON.stringify(sizes));
    }, 500);
    saveSizesToStorage(columnSizing);
  }, [columnSizing, tableSizesKey]);

  const setColumnSizing = useCallback((sizesOrUpdater: Updater<ColumnSizingState>) => {
    setColumnSizingState(sizesOrUpdater);
  }, []);

  return {
    columnSizing,
    setColumnSizing,
  };
}

export function useColumnOrder(columns: ColumnDef<ExtendedEntry>[], tableRoot: TableRoot = 'cuesheet') {
  const tableOrderKey = useMemo(() => makeStageKey(`${tableRoot}-table-order`), [tableRoot]);

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

export function useColumnVisibility(tableRoot: TableRoot = 'cuesheet') {
  const tableHiddenKey = useMemo(() => makeStageKey(`${tableRoot}-table-hidden`), [tableRoot]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage({
    key: tableHiddenKey,
    defaultValue: {},
  });

  return {
    columnVisibility,
    setColumnVisibility,
  };
}
