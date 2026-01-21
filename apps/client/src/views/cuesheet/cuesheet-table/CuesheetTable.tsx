import { useCallback, useEffect, useMemo, useRef } from 'react';
import { TableVirtuoso, TableVirtuosoHandle } from 'react-virtuoso';
import { useTableNav } from '@table-nav/react';
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { isOntimeDelay, isOntimeGroup, isOntimeMilestone, OntimeEntry, TimeField } from 'ontime-types';

import EmptyPage from '../../../common/components/state/EmptyPage';
import EmptyTableBody from '../../../common/components/state/EmptyTableBody';
import { useEntryActionsContext } from '../../../common/context/EntryActionsContext';
import { useSelectedEventId } from '../../../common/hooks/useSocket';
import { useFlatRundownWithMetadata } from '../../../common/hooks-query/useRundown';
import type { ExtendedEntry } from '../../../common/utils/rundownMetadata';
import { usePersistedRundownOptions } from '../../../features/rundown/rundown.options';
import EditorTableSettings from '../../../features/rundown/rundown-table/EditorTableSettings';
import { useEventSelection } from '../../../features/rundown/useEventSelection';
import { AppMode } from '../../../ontimeConfig';
import { usePersistedCuesheetOptions } from '../cuesheet.options';

import { CuesheetHeader, SortableCuesheetHeader } from './cuesheet-table-elements/CuesheetHeader';
import DelayRow from './cuesheet-table-elements/DelayRow';
import EventRow from './cuesheet-table-elements/EventRow';
import GroupRow from './cuesheet-table-elements/GroupRow';
import MilestoneRow from './cuesheet-table-elements/MilestoneRow';
import TableMenu from './cuesheet-table-menu/TableMenu';
import CuesheetTableSettings from './cuesheet-table-settings/CuesheetTableSettings';
import { useColumnOrder, useColumnSizes, useColumnVisibility } from './useColumnManager';

import style from './CuesheetTable.module.scss';

interface CuesheetTableProps {
  columns: ColumnDef<ExtendedEntry>[];
  cuesheetMode: AppMode;
  tableRoot?: 'editor' | 'cuesheet';
}

export default function CuesheetTable({ columns, cuesheetMode, tableRoot = 'cuesheet' }: CuesheetTableProps) {
  const { data, status } = useFlatRundownWithMetadata();
  const { updateEntry, updateTimer } = useEntryActionsContext();

  const useOptions = tableRoot === 'editor' ? usePersistedRundownOptions : usePersistedCuesheetOptions;
  const showDelayedTimes = useOptions((state) => state.showDelayedTimes);
  const hideTableSeconds = useOptions((state) => state.hideTableSeconds);
  const hideIndexColumn = useOptions((state) => state.hideIndexColumn);

  const selectedEventId = useSelectedEventId();
  const cursor = useEventSelection((state) => state.cursor);
  const setScrollHandler = useEventSelection((state) => state.setScrollHandler);

  const virtuosoRef = useRef<TableVirtuosoHandle | null>(null);
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

  const { columnOrder, resetColumnOrder } = useColumnOrder(columns, tableRoot);
  const { columnSizing, setColumnSizing } = useColumnSizes(tableRoot);
  const { columnVisibility, setColumnVisibility } = useColumnVisibility(tableRoot);

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

  // in Run mode, follow the current event
  useEffect(() => {
    if (virtuosoRef.current === null || cuesheetMode !== AppMode.Run || !selectedEventId) {
      return;
    }

    const eventIndex = data.findIndex((event) => event.id === selectedEventId);
    if (eventIndex === -1) {
      return;
    }

    virtuosoRef.current.scrollToIndex({ index: eventIndex, behavior: 'auto', align: 'start', offset: -50 });
  }, [cuesheetMode, data, selectedEventId]);

  // Provide an imperative scroll handler for explicit jumps (finder/keyboard)
  useEffect(() => {
    const handler = (entryId: string) => {
      if (virtuosoRef.current === null) {
        return;
      }

      const eventIndex = data.findIndex((event) => event.id === entryId);
      if (eventIndex === -1) {
        return;
      }

      virtuosoRef.current.scrollToIndex({ index: eventIndex, behavior: 'auto', align: 'start', offset: -50 });
    };

    setScrollHandler(handler);

    return () => {
      setScrollHandler(null);
    };
  }, [data, setScrollHandler]);

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

  const allLeafColumns = table.getAllLeafColumns();
  const { rows } = table.getRowModel();

  const isLoading = !data || status === 'pending';

  if (isLoading) {
    return <EmptyPage text='Loading...' />;
  }

  // control components need different implementations for handling permissions
  const TableRootSettings = tableRoot === 'editor' ? EditorTableSettings : CuesheetTableSettings;

  return (
    <>
      <TableRootSettings
        columns={allLeafColumns}
        handleResetResizing={resetColumnResizing}
        handleResetReordering={resetColumnOrder}
        handleClearToggles={setAllVisible}
      />
      <TableVirtuoso
        ref={virtuosoRef}
        data={data}
        increaseViewportBy={{ top: 100, bottom: 200 }}
        components={{
          EmptyPlaceholder: () => <EmptyTableBody text='No data in rundown' />,
          Table: ({ style: injectedStyles, ...virtuosoProps }) => {
            return (
              <table
                className={style.cuesheet}
                id='cuesheet'
                style={{ ...injectedStyles, ...columnSizeVars }}
                {...listeners}
                {...virtuosoProps}
              />
            );
          },
          TableRow: ({ item: _item, style: injectedStyles, ...virtuosoProps }) => {
            // eslint-disable-next-line react/destructuring-assignment
            const rowIndex = virtuosoProps['data-index'];
            const row = rows[rowIndex];
            const key = row.original.id;
            const entry = row.original;
            const hasCursor = entry.id === cursor;

            if (isOntimeGroup(entry)) {
              return (
                <GroupRow
                  key={key}
                  groupId={entry.id}
                  colour={entry.colour}
                  rowId={row.id}
                  rowIndex={row.index}
                  table={table}
                  injectedStyles={injectedStyles}
                  hasCursor={hasCursor}
                  {...virtuosoProps}
                />
              );
            }

            if (isOntimeDelay(entry)) {
              return (
                <DelayRow
                  key={key}
                  duration={entry.duration}
                  injectedStyles={injectedStyles}
                  hasCursor={hasCursor}
                  {...virtuosoProps}
                />
              );
            }

            if (isOntimeMilestone(entry)) {
              return (
                <MilestoneRow
                  key={key}
                  entryId={entry.id}
                  isPast={entry.isPast}
                  parentBgColour={entry.groupColour}
                  parentId={entry.parent}
                  colour={entry.colour}
                  rowId={row.id}
                  rowIndex={rowIndex}
                  table={table}
                  injectedStyles={injectedStyles}
                  hasCursor={hasCursor}
                  {...virtuosoProps}
                />
              );
            }

            return (
              <EventRow
                key={row.id}
                id={entry.id}
                eventIndex={entry.eventIndex}
                colour={entry.colour}
                isFirstAfterGroup={entry.isFirstAfterGroup}
                isLoaded={entry.isLoaded}
                isPast={entry.isPast}
                groupColour={entry.groupColour}
                flag={entry.flag}
                skip={entry.skip}
                parent={entry.parent}
                rowId={row.id}
                rowIndex={rowIndex}
                table={table}
                injectedStyles={injectedStyles}
                hasCursor={hasCursor}
                {...virtuosoProps}
              />
            );
          },
          TableHead: (virtuosoProps) => <thead className={style.tableHeader} {...virtuosoProps} />,
        }}
        fixedHeaderContent={() => {
          return table.getHeaderGroups().map((headerGroup) => {
            const HeaderComponent = table.getState().columnSizingInfo.isResizingColumn
              ? CuesheetHeader
              : SortableCuesheetHeader;

            // if the table is being resized, we render non-sortable headers to avoid performance issues
            return <HeaderComponent key={headerGroup.id} cuesheetMode={cuesheetMode} headerGroup={headerGroup} />;
          });
        }}
      />

      <TableMenu />
    </>
  );
}
