import { useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTableNav } from '@table-nav/react';
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { isOntimeEvent, MaybeString, OntimeEvent, OntimeRundown, OntimeRundownEntry, TimeField } from 'ontime-types';

import { useEventAction } from '../../../common/hooks/useEventAction';
import useFollowComponent from '../../../common/hooks/useFollowComponent';
import { useCuesheetOptions } from '../cuesheet.options';

import CuesheetBody from './cuesheet-table-elements/CuesheetBody';
import CuesheetHeader from './cuesheet-table-elements/CuesheetHeader';
import CuesheetTableMenu from './cuesheet-table-menu/CuesheetTableMenu';
import CuesheetTableSettings from './cuesheet-table-settings/CuesheetTableSettings';
import useColumnManager from './useColumnManager';

import style from './CuesheetTable.module.scss';

interface CuesheetTableProps {
  data: OntimeRundown;
  columns: ColumnDef<OntimeRundownEntry>[];
  showModal: (eventId: MaybeString) => void;
}

export default function CuesheetTable(props: CuesheetTableProps) {
  const { data, columns, showModal } = props;

  const { updateEvent, updateTimer } = useEventAction();
  const [searchParams] = useSearchParams();
  const allowMainEdits = !searchParams.get('lmain');
  const allowCustomEdits = !searchParams.get('lcustom');

  const { followSelected, showDelayedTimes, hideTableSeconds } = useCuesheetOptions();
  const { columnVisibility, columnOrder, columnSizing, resetColumnOrder, setColumnVisibility, setColumnSizing } =
    useColumnManager(columns);

  const selectedRef = useRef<HTMLTableRowElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  useFollowComponent({ followRef: selectedRef, scrollRef: tableContainerRef, doFollow: followSelected });

  const { listeners } = useTableNav();

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
    meta: {
      handleUpdate: (rowIndex: number, accessor: string, payload: string, isCustom = false) => {
        // check if value is the same
        const event = data[rowIndex];

        if (!event || !isOntimeEvent(event)) {
          return;
        }

        // skip if there is no value change
        const key = accessor as keyof OntimeEvent;
        const previousValue = event[key];
        if (previousValue === payload) {
          return;
        }

        if (isCustom) {
          updateEvent({ id: event.id, custom: { [accessor]: payload } });
          return;
        }

        updateEvent({ id: event.id, [accessor]: payload });
      },
      handleUpdateTimer: (eventId: string, field: TimeField, payload) => {
        // the timer element already contains logic to avoid submitting a unchanged value
        updateTimer(eventId, field, payload, true);
      },
      options: {
        showDelayedTimes,
        hideTableSeconds,
        allowMainEdits,
        allowCustomEdits,
      },
    },
  });

  const setAllVisible = useCallback(() => {
    table.toggleAllColumnsVisible(true);
  }, []);

  const resetColumnResizing = useCallback(() => {
    setColumnSizing({});
  }, []);

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
