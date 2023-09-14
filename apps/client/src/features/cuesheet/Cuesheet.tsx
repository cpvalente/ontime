import { useRef } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { isOntimeBlock, isOntimeDelay, isOntimeEvent, OntimeRundown, OntimeRundownEntry } from 'ontime-types';

import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useLocalStorage } from '../../common/hooks/useLocalStorage';

import BlockRow from './cuesheet-table-elements/BlockRow';
import CuesheetHeader from './cuesheet-table-elements/CuesheetHeader';
import DelayRow from './cuesheet-table-elements/DelayRow';
import EventRow from './cuesheet-table-elements/EventRow';
import CuesheetTableSettings from './cuesheet-table-settings/CuesheetTableSettings';
import { useCuesheetSettings } from './store/CuesheetSettings';
import { initialColumnOrder } from './cuesheetCols';

import style from './Cuesheet.module.scss';

interface CuesheetProps {
  data: OntimeRundown;
  columns: ColumnDef<OntimeRundownEntry>[];
  handleUpdate: (rowIndex: number, accessor: keyof OntimeRundownEntry, payload: unknown) => void;
  selectedId: string | null;
}

export default function Cuesheet({ data, columns, handleUpdate, selectedId }: CuesheetProps) {
  const followSelected = useCuesheetSettings((state) => state.followSelected);
  const showSettings = useCuesheetSettings((state) => state.showSettings);
  const showDelayBlock = useCuesheetSettings((state) => state.showDelayBlock);
  const showPrevious = useCuesheetSettings((state) => state.showPrevious);

  const [columnVisibility, setColumnVisibility] = useLocalStorage('table-hidden', {});
  const [columnOrder, saveColumnOrder] = useLocalStorage<string[]>('table-order', initialColumnOrder);
  const [columnSizing, setColumnSizing] = useLocalStorage('table-sizes', {});

  const selectedRef = useRef<HTMLTableRowElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  useFollowComponent({ followRef: selectedRef, scrollRef: tableContainerRef, doFollow: followSelected });

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange',
    state: {
      columnOrder,
      columnVisibility,
      columnSizing,
    },
    meta: {
      handleUpdate,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
  });

  const resetColumnOrder = () => {
    saveColumnOrder(initialColumnOrder);
  };

  const setAllVisible = () => {
    table.toggleAllColumnsVisible(true);
  };

  const resetColumnResizing = () => {
    setColumnSizing({});
  };

  const headerGroups = table.getHeaderGroups;

  let eventIndex = 0;
  let isPast = Boolean(selectedId);

  return (
    <>
      {showSettings && (
        <CuesheetTableSettings
          columns={table.getAllLeafColumns()}
          handleResetResizing={resetColumnResizing}
          handleResetReordering={resetColumnOrder}
          handleClearToggles={setAllVisible}
        />
      )}
      <div ref={tableContainerRef} className={style.cuesheetContainer}>
        <table className={style.cuesheet}>
          <CuesheetHeader headerGroups={headerGroups} />
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const key = row.original.id;
              const isSelected = selectedId === key;
              if (isSelected) {
                isPast = false;
              }

              if (isOntimeBlock(row.original)) {
                return <BlockRow key={key} title={row.original.title} />;
              }
              if (isOntimeDelay(row.original)) {
                const delayVal = row.original.duration;

                if (!showDelayBlock || delayVal === 0) {
                  return null;
                }

                return <DelayRow key={key} duration={delayVal} />;
              }
              if (isOntimeEvent(row.original)) {
                eventIndex++;
                const isSelected = key === selectedId;
                if (isSelected) {
                  isPast = false;
                }

                if (isPast && !showPrevious) {
                  return null;
                }

                let rowBgColour: string | undefined;
                if (isSelected) {
                  rowBgColour = 'var(--cuesheet-running-bg-override, #D20300)'; // $red-700
                }

                return (
                  <EventRow
                    key={key}
                    eventIndex={eventIndex}
                    isPast={isPast}
                    selectedRef={isSelected ? selectedRef : undefined}
                    skip={row.original.skip}
                    colour={row.original.colour}
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td key={cell.id} style={{ width: cell.column.getSize(), backgroundColor: rowBgColour }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </EventRow>
                );
              }

              // currently there is no scenario where entryType is not handled above, either way...
              return null;
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
