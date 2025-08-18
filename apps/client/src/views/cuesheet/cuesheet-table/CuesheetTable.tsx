import { memo, useCallback, useMemo } from 'react';
import { useTableNav } from '@table-nav/react';
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { OntimeEntry, TimeField } from 'ontime-types';

import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { useFollowSelected } from '../../../common/hooks/useFollowComponent';
import { AppMode } from '../../../ontimeConfig';
import { usePersistedCuesheetOptions } from '../cuesheet.options';

import CuesheetBody from './cuesheet-table-elements/CuesheetBody';
import CuesheetHeader from './cuesheet-table-elements/CuesheetHeader';
import CuesheetTableMenu from './cuesheet-table-menu/CuesheetTableMenu';
import CuesheetTableSettings from './cuesheet-table-settings/CuesheetTableSettings';
import useColumnManager from './useColumnManager';

import style from './CuesheetTable.module.scss';

interface CuesheetTableProps {
  data: OntimeEntry[];
  columns: ColumnDef<OntimeEntry>[];
  cuesheetMode: AppMode;
}

export default function CuesheetTable({ data, columns, cuesheetMode }: CuesheetTableProps) {
  const { updateEntry, updateTimer } = useEntryActions();
  const showDelayedTimes = usePersistedCuesheetOptions((state) => state.showDelayedTimes);
  const hideTableSeconds = usePersistedCuesheetOptions((state) => state.hideTableSeconds);
  const hideIndexColumn = usePersistedCuesheetOptions((state) => state.hideIndexColumn);

  const { selectedRef, scrollRef } = useFollowSelected(cuesheetMode === AppMode.Run);

  const { listeners } = useTableNav();

  const meta = useMemo(
    () => ({
      handleUpdate: (rowIndex: number, accessor: string, payload: string, isCustom = false) => {
        // check if value is the same
        const event = data[rowIndex];

        if (!event) {
          return;
        }

        // skip if there is no value change
        const key = accessor as keyof OntimeEntry;
        const previousValue = event[key];
        if (previousValue === payload) {
          return;
        }

        if (isCustom) {
          updateEntry({ id: event.id, custom: { [accessor]: payload } });
          return;
        }

        updateEntry({ id: event.id, [accessor]: payload });
      },
      handleUpdateTimer: (eventId: string, field: TimeField, payload: string) => {
        // the timer element already contains logic to avoid submitting a unchanged value
        updateTimer(eventId, field, payload, true);
      },
      options: {
        showDelayedTimes,
        hideTableSeconds,
        cuesheetMode,
        hideIndexColumn,
      },
    }),
    [cuesheetMode, data, hideIndexColumn, hideTableSeconds, showDelayedTimes, updateEntry, updateTimer],
  );

  const { columnVisibility, columnOrder, columnSizing, resetColumnOrder, setColumnVisibility, setColumnSizing } =
    useColumnManager(columns);

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange',
    state: {
      columnOrder,
      columnVisibility,
      columnSizing,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    meta,
  });

  const setAllVisible = useCallback(() => {
    table.toggleAllColumnsVisible(true);
  }, [table]);

  const resetColumnResizing = useCallback(() => {
    setColumnSizing({});
  }, [setColumnSizing]);

  const headerGroups = table.getHeaderGroups();
  const rowModel = table.getRowModel();
  const allLeafColumns = table.getAllLeafColumns();

  /**
   * To improve performance on resizing, we memoise the column sizes
   * and pass them as CSS variables to the table container.
   */
  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: number } = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (!header) continue;
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return colSizes;
    // eslint-disable-next-line react-compiler/react-compiler -- unfortunately this is what we need
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this works well and follows documentation
  }, [table.getState().columnSizingInfo, table.getState().columnSizing]);

  return (
    <>
      <CuesheetTableSettings
        columns={allLeafColumns}
        handleResetResizing={resetColumnResizing}
        handleResetReordering={resetColumnOrder}
        handleClearToggles={setAllVisible}
      />
      <div className={style.cuesheetContainer} ref={scrollRef}>
        <table className={style.cuesheet} id='cuesheet' style={{ ...columnSizeVars }} {...listeners}>
          <CuesheetHeader headerGroups={headerGroups} cuesheetMode={cuesheetMode} />
          {table.getState().columnSizingInfo.isResizingColumn ? (
            <MemoisedBody rowModel={rowModel} selectedRef={selectedRef} table={table} />
          ) : (
            <CuesheetBody rowModel={rowModel} selectedRef={selectedRef} table={table} />
          )}
        </table>
      </div>
      <CuesheetTableMenu />
    </>
  );
}

/**
 * While dragging, we avoid re-rendering the body by render
 */
const MemoisedBody = memo(
  CuesheetBody,
  (prev, next) => prev.table.options.data === next.table.options.data,
) as typeof CuesheetBody;
