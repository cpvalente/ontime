import { useLocalStorage } from '@mantine/hooks';
import { ColumnSizingState, Updater } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { debounce } from '../../../common/utils/debounce';
import { makeStageKey } from '../../../common/utils/localStorage';
import type { CuesheetColumnDef } from './cuesheetTable.features';

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

export function useColumnOrder(columns: CuesheetColumnDef[], tableRoot: TableRoot = 'cuesheet') {
  // The old key also stored implicit defaults, which cannot be distinguished from personal layouts.
  const tableOrderKey = useMemo(() => makeStageKey(`${tableRoot}-table-order-override`), [tableRoot]);

  const [savedOrder, saveColumnOrder] = useLocalStorage<string[] | null>({
    key: tableOrderKey,
    defaultValue: null,
  });

  const columnOrder = useMemo(() => {
    const defaultOrder = columns.map((col) => col.id as string);
    if (!savedOrder) return defaultOrder;
    return [
      ...savedOrder.filter((id) => defaultOrder.includes(id)),
      ...defaultOrder.filter((id) => !savedOrder.includes(id)),
    ];
  }, [columns, savedOrder]);

  const resetColumnOrder = useCallback(() => {
    saveColumnOrder(null);
  }, [saveColumnOrder]);

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
