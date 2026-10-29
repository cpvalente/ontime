import { useTableNav } from '@table-nav/react';
import { useTable } from '@tanstack/react-table';
import {
  EntryId,
  OntimeEntry,
  SupportedEntry,
  TimeField,
  isOntimeDelay,
  isOntimeGroup,
  isOntimeMilestone,
} from 'ontime-types';
import { ComponentProps, ReactNode, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ContextProp,
  ItemProps,
  TableComponents,
  TableProps,
  TableVirtuoso,
  TableVirtuosoHandle,
} from 'react-virtuoso';

import EmptyFill from '../../../common/components/state/EmptyFill';
import EmptyRundown from '../../../common/components/state/EmptyRundown';
import { useEntryActionsContext } from '../../../common/context/EntryActionsContext';
import { useRundownScope } from '../../../common/context/RundownScopeContext';
import { useRundownWithMetadata, useScopedSelectedEventId } from '../../../common/hooks-query/useRundown';
import { useFlatEntries } from '../../../common/hooks-query/useRundownById';
import type { RundownMetadataObject } from '../../../common/utils/rundownMetadata';
import { useUserScrolled } from '../../../features/rundown/hooks/useUserScrolled';
import { usePersistedRundownOptions } from '../../../features/rundown/rundown.options';
import { makeRevealLocation } from '../../../features/rundown/rundown.utils';
import { useEventSelection } from '../../../features/rundown/useEventSelection';
import { AppMode } from '../../../ontimeConfig';
import { useTranslation } from '../../../translation/TranslationProvider';
import { usePersistedCuesheetOptions } from '../cuesheet.options';
import { useCuesheetPermissions } from '../useTablePermissions';
import { CuesheetHeader, SortableCuesheetHeader } from './cuesheet-table-elements/CuesheetHeader';
import DelayRow from './cuesheet-table-elements/DelayRow';
import EventRow from './cuesheet-table-elements/EventRow';
import GroupRow from './cuesheet-table-elements/GroupRow';
import MilestoneRow from './cuesheet-table-elements/MilestoneRow';
import TableMenu from './cuesheet-table-menu/TableMenu';
import CuesheetTableHeaderToolbar from './cuesheet-table-settings/CuesheetTableHeaderToolbar';
import {
  CuesheetColumnDef,
  CuesheetColumn,
  CuesheetTable as CuesheetTableInstance,
  CuesheetTableMeta,
  cuesheetTableFeatures,
} from './cuesheetTable.features';
import { useColumnOrder, useColumnSizes, useColumnVisibility } from './useColumnManager';

import style from './CuesheetTable.module.scss';

type CuesheetTableBaseProps = {
  columns: CuesheetColumnDef[];
  cuesheetMode: AppMode;
  insertElement?: ReactNode;
};

type EditorCuesheetTableProps = CuesheetTableBaseProps & {
  tableRoot: 'editor';
  setCuesheetMode?: undefined;
};

type ViewCuesheetTableProps = CuesheetTableBaseProps & {
  tableRoot: 'cuesheet';
  setCuesheetMode: (mode: AppMode) => void;
};

type CuesheetTableProps = EditorCuesheetTableProps | ViewCuesheetTableProps;

export default function CuesheetTable({
  columns,
  cuesheetMode,
  tableRoot,
  setCuesheetMode,
  insertElement,
}: CuesheetTableProps) {
  const { isLoaded: isCurrentRundown } = useRundownScope();
  // entries keep their query cache references and metadata stays apart, so a change re-renders only the rows it touches
  const { data: rundown, status, rundownMetadata } = useRundownWithMetadata();
  const flatRundown = useFlatEntries(rundown);
  const selectedEventId = useScopedSelectedEventId();
  const { updateEntry, updateTimer, addEntry } = useEntryActionsContext();
  const { getLocalizedString } = useTranslation();
  const canCreateEntries = useCuesheetPermissions((state) => state.canCreateEntries) && cuesheetMode === AppMode.Edit;

  const useOptions = tableRoot === 'editor' ? usePersistedRundownOptions : usePersistedCuesheetOptions;
  const optionsStore = useOptions();
  const { showDelayedTimes, hideTableSeconds, hideIndexColumn } = optionsStore;

  const setScrollHandler = useEventSelection((state) => state.setScrollHandler);

  const virtuosoRef = useRef<TableVirtuosoHandle | null>(null);
  const { userScrolledRef, scrollerRef } = useUserScrolled();
  const { listeners } = useTableNav();

  const options = useMemo(
    () => ({ showDelayedTimes, hideTableSeconds, cuesheetMode, hideIndexColumn }),
    [cuesheetMode, hideIndexColumn, hideTableSeconds, showDelayedTimes],
  );

  const meta = useMemo(
    (): CuesheetTableMeta => ({
      handleUpdate: (entryId: EntryId, accessor: string, payload: string, isCustom = false) => {
        if (isCustom) {
          updateEntry({ id: entryId, custom: { [accessor]: payload } });
          return;
        }

        updateEntry({ id: entryId, [accessor]: payload });
      },
      handleUpdateTimer: (eventId: string, field: TimeField, payload: string) => {
        // the timer element already contains logic to avoid submitting a unchanged value
        updateTimer(eventId, field, payload, true);
      },
      options,
    }),
    [options, updateEntry, updateTimer],
  );

  const { columnOrder, resetColumnOrder } = useColumnOrder(columns, tableRoot);
  const { columnSizing, setColumnSizing } = useColumnSizes(tableRoot);
  const { columnVisibility, setColumnVisibility } = useColumnVisibility(tableRoot);

  const table = useTable({
    features: cuesheetTableFeatures,
    data: flatRundown,
    columns,
    columnResizeMode: 'onChange',
    state: {
      columnOrder,
      columnVisibility,
      columnSizing,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    meta,
  });

  const setAllVisible = useCallback(() => {
    table.toggleAllColumnsVisible(true);
  }, [table]);

  const resetColumnResizing = useCallback(() => {
    setColumnSizing({});
  }, [setColumnSizing]);

  // the follow and jump effects read the latest rows through a ref, so edits only scroll the table to keep the current event pinned
  const flatRundownRef = useRef(flatRundown);
  useEffect(() => {
    flatRundownRef.current = flatRundown;
  }, [flatRundown]);
  const hasRows = flatRundown.length > 0;

  // in Run mode, follow the current event: pin it to the top when it changes
  useEffect(() => {
    if (virtuosoRef.current === null || cuesheetMode !== AppMode.Run || !selectedEventId || !hasRows) {
      return;
    }

    const eventIndex = flatRundownRef.current.findIndex((event) => event.id === selectedEventId);
    if (eventIndex === -1) {
      return;
    }

    userScrolledRef.current = false;
    virtuosoRef.current.scrollToIndex({ index: eventIndex, behavior: 'auto', align: 'start', offset: -50 });
  }, [cuesheetMode, hasRows, selectedEventId, userScrolledRef]);

  // edits move rows around the current event: keep it pinned until the user scrolls the table themselves
  useEffect(() => {
    if (virtuosoRef.current === null || userScrolledRef.current || cuesheetMode !== AppMode.Run || !selectedEventId) {
      return;
    }

    const eventIndex = flatRundown.findIndex((event) => event.id === selectedEventId);
    if (eventIndex === -1) {
      return;
    }

    virtuosoRef.current.scrollToIndex({ index: eventIndex, behavior: 'auto', align: 'start', offset: -50 });
  }, [flatRundown, cuesheetMode, selectedEventId, userScrolledRef]);

  // Provide an imperative scroll handler for explicit jumps (finder/keyboard)
  // reveals the entry with the smallest scroll, and only if it is not already in view
  useEffect(() => {
    const handler = (entryId: string) => {
      if (virtuosoRef.current === null) {
        return;
      }

      const eventIndex = flatRundownRef.current.findIndex((event) => event.id === entryId);
      if (eventIndex === -1) {
        return;
      }

      virtuosoRef.current.scrollIntoView({
        index: eventIndex,
        behavior: 'auto',
        calculateViewLocation: revealLocation,
      });
    };

    setScrollHandler(handler);

    return () => {
      setScrollHandler(null);
    };
  }, [setScrollHandler]);

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
  }, [columns, table.state.columnResizing, table.state.columnSizing]);

  const allLeafColumns = table.getAllLeafColumns();
  const visibleColumns = table.getVisibleLeafColumns();
  const { rows } = table.getRowModel();
  const virtuosoContext = useMemo(
    () => ({
      columnSizeVars,
      listeners,
      options,
      rows,
      rundownMetadata,
      visibleColumns,
    }),
    [columnSizeVars, listeners, options, rows, rundownMetadata, visibleColumns],
  );

  const computeItemKey = useCallback((_: number, item: OntimeEntry) => item.id, []);
  const fixedHeaderContent = useCallback(() => {
    return table.getHeaderGroups().map((headerGroup) => {
      const HeaderComponent = table.state.columnResizing.isResizingColumn ? CuesheetHeader : SortableCuesheetHeader;

      // if the table is being resized, we render non-sortable headers to avoid performance issues
      return (
        <HeaderComponent
          key={headerGroup.id}
          cuesheetMode={cuesheetMode}
          headerGroup={headerGroup}
          hideIndexColumn={hideIndexColumn}
        />
      );
    });
  }, [cuesheetMode, hideIndexColumn, table]);

  // avoid showing the editable empty state before we know whether the rundown is actually empty
  if (status === 'pending') {
    return <EmptyFill text='Loading…' className={style.tableLoading} />;
  }

  if (status === 'error') {
    return <EmptyFill text={getLocalizedString('common.no_data')} className={style.tableLoading} />;
  }

  return (
    <>
      <CuesheetTableHeaderToolbar
        columns={allLeafColumns}
        optionsStore={optionsStore}
        handleResetResizing={resetColumnResizing}
        handleResetReordering={resetColumnOrder}
        handleClearToggles={setAllVisible}
        insertElement={insertElement}
        modeControls={
          tableRoot === 'cuesheet'
            ? {
                cuesheetMode,
                setCuesheetMode,
                isCurrentRundown,
              }
            : undefined
        }
        showShare={tableRoot === 'cuesheet'}
      />
      {flatRundown.length === 0 ? (
        <EmptyRundown
          handleAddNew={canCreateEntries ? (type: SupportedEntry) => addEntry({ type }) : undefined}
          className={style.tableLoading}
        />
      ) : (
        <TableVirtuoso
          ref={virtuosoRef}
          scrollerRef={scrollerRef}
          data={flatRundown}
          context={virtuosoContext}
          style={tableRoot === 'editor' ? { paddingLeft: '1rem' } : undefined}
          computeItemKey={computeItemKey}
          increaseViewportBy={{ top: 100, bottom: 200 }}
          components={virtuosoComponents}
          fixedHeaderContent={fixedHeaderContent}
        />
      )}

      <TableMenu />
    </>
  );
}

interface CuesheetVirtuosoContext {
  columnSizeVars: { [key: string]: number };
  listeners: ReturnType<typeof useTableNav>['listeners'];
  options: CuesheetTableMeta['options'];
  rows: ReturnType<CuesheetTableInstance['getRowModel']>['rows'];
  rundownMetadata: RundownMetadataObject;
  visibleColumns: CuesheetColumn[];
}

const CuesheetTableElement = memo(function CuesheetTableElement({
  style: injectedStyles,
  context,
  ...virtuosoProps
}: TableProps & ContextProp<CuesheetVirtuosoContext>) {
  return (
    <table
      className={style.cuesheet}
      id='cuesheet'
      style={{ ...injectedStyles, ...context.columnSizeVars }}
      {...context.listeners}
      {...virtuosoProps}
    />
  );
});

const CuesheetTableHead = memo(function CuesheetTableHead({
  context: _context,
  className: _className,
  ...virtuosoProps
}: ComponentProps<'thead'> & ContextProp<CuesheetVirtuosoContext>) {
  return <thead className={style.tableHeader} {...virtuosoProps} />;
});

const CuesheetTableRow = memo(function CuesheetTableRow({
  item: _item,
  // rows render their own cells, virtuoso's default content is a new element every render and would defeat the row memo
  children: _children,
  style: injectedStyles,
  context,
  ...virtuosoProps
}: ItemProps<OntimeEntry> & ContextProp<CuesheetVirtuosoContext>) {
  // eslint-disable-next-line react/destructuring-assignment
  const rowIndex = virtuosoProps['data-index'];
  const row = context.rows[rowIndex];
  const hasCursor = useEventSelection((state) => state.cursor === row?.original.id);
  const metadata = row ? context.rundownMetadata[row.original.id] : undefined;
  if (!row || !metadata) {
    return null;
  }

  const key = row.original.id;
  const entry = row.original;

  /**
   * Rows are memoised on these props, so they must carry everything a row renders.
   * The hook's table object changes every render, row.table is the stable instance.
   */
  const rowProps = {
    rowId: row.id,
    rowIndex,
    table: row.table,
    options: context.options,
    visibleColumns: context.visibleColumns,
    injectedStyles,
    hasCursor,
  };

  if (isOntimeGroup(entry)) {
    return <GroupRow key={key} entry={entry} {...rowProps} {...virtuosoProps} />;
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
        entry={entry}
        isPast={metadata.isPast}
        parentBgColour={metadata.groupColour}
        {...rowProps}
        {...virtuosoProps}
      />
    );
  }

  return (
    <EventRow
      key={key}
      entry={entry}
      eventIndex={metadata.eventIndex}
      isFirstAfterGroup={metadata.isFirstAfterGroup}
      isLoaded={metadata.isLoaded}
      isPast={metadata.isPast}
      groupColour={metadata.groupColour}
      {...rowProps}
      {...virtuosoProps}
    />
  );
});

// keep the neighbouring rows in view around a revealed row
const revealLocation = makeRevealLocation(50);

const virtuosoComponents: TableComponents<OntimeEntry, CuesheetVirtuosoContext> = {
  Table: CuesheetTableElement,
  TableHead: CuesheetTableHead,
  TableRow: CuesheetTableRow,
};
