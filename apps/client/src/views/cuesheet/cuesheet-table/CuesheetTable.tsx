import { useCallback, useMemo, useRef } from 'react';
import { useTableNav } from '@table-nav/react';
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { MaybeString, OntimeEntry, TimeField } from 'ontime-types';

import { useEntryActions } from '../../../common/hooks/useEntryAction';
import useFollowComponent from '../../../common/hooks/useFollowComponent';
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
  showModal: (eventId: MaybeString) => void;
}

export default function CuesheetTable({ data, columns, showModal }: CuesheetTableProps) {
  const { updateEntry, updateTimer } = useEntryActions();
  const followPlayback = usePersistedCuesheetOptions((state) => state.followPlayback);
  const showDelayedTimes = usePersistedCuesheetOptions((state) => state.showDelayedTimes);
  const hideTableSeconds = usePersistedCuesheetOptions((state) => state.hideTableSeconds);
  const { columnVisibility, columnOrder, columnSizing, resetColumnOrder, setColumnVisibility, setColumnSizing } =
    useColumnManager(columns);

  const selectedRef = useRef<HTMLTableRowElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  useFollowComponent({ followRef: selectedRef, scrollRef: tableContainerRef, doFollow: followPlayback });

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
      },
    }),
    [data, hideTableSeconds, showDelayedTimes, updateEntry, updateTimer],
  );

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

  return (
    <>
      <CuesheetTableSettings
        columns={allLeafColumns}
        handleResetResizing={resetColumnResizing}
        handleResetReordering={resetColumnOrder}
        handleClearToggles={setAllVisible}
      />
      <div ref={tableContainerRef} className={style.cuesheetContainer}>
        <table className={style.cuesheet} id='cuesheet' {...listeners}>
          <CuesheetHeader headerGroups={headerGroups} />
          <CuesheetBody rowModel={rowModel} selectedRef={selectedRef} table={table} />
        </table>
      </div>
      <CuesheetTableMenu showModal={showModal} />
    </>
  );
}
