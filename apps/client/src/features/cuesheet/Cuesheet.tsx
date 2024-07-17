import { useCallback, useRef } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Color from 'color';
import { isOntimeBlock, isOntimeDelay, isOntimeEvent, OntimeRundown, OntimeRundownEntry } from 'ontime-types';

import useFollowComponent from '../../common/hooks/useFollowComponent';
import { getAccessibleColour } from '../../common/utils/styleUtils';

import BlockRow from './cuesheet-table-elements/BlockRow';
import CuesheetHeader from './cuesheet-table-elements/CuesheetHeader';
import DelayRow from './cuesheet-table-elements/DelayRow';
import EventRow from './cuesheet-table-elements/EventRow';
import CuesheetTableSettings from './cuesheet-table-settings/CuesheetTableSettings';
import { useCuesheetSettings } from './store/CuesheetSettings';
import useColumnManager from './useColumnManager';

import style from './Cuesheet.module.scss';

interface CuesheetProps {
  data: OntimeRundown;
  columns: ColumnDef<OntimeRundownEntry>[];
  handleUpdate: (rowIndex: number, accessor: keyof OntimeRundownEntry, payload: unknown) => void;
  selectedId: string | null;
  currentBlockId: string | null;
}

export default function Cuesheet({ data, columns, handleUpdate, selectedId, currentBlockId }: CuesheetProps) {
  const { followSelected, showSettings, showDelayBlock, showPrevious, showIndexColumn } = useCuesheetSettings();
  const {
    columnVisibility,
    columnOrder,
    columnSizing,
    resetColumnOrder,
    setColumnVisibility,
    saveColumnOrder,
    setColumnSizing,
  } = useColumnManager(columns);

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

  const setAllVisible = () => {
    table.toggleAllColumnsVisible(true);
  };

  const resetColumnResizing = () => {
    setColumnSizing({});
  };

  const reorder = useCallback(
    (fromId: string, toId: string) => {
      // get index of from
      const fromIndex = columnOrder.indexOf(fromId);

      // get index of to
      const toIndex = columnOrder.indexOf(toId);

      if (toIndex === -1) {
        return;
      }

      const reorderedCols = [...columnOrder];
      const reorderedItem = reorderedCols.splice(fromIndex, 1);
      reorderedCols.splice(toIndex, 0, reorderedItem[0]);
      saveColumnOrder(reorderedCols);
    },
    [columnOrder, saveColumnOrder],
  );

  const headerGroups = table.getHeaderGroups();
  const rowModel = table.getRowModel();
  const allLeafColumns = table.getAllLeafColumns();

  let eventIndex = 0;
  let isPast = Boolean(selectedId);

  return (
    <>
      {showSettings && (
        <CuesheetTableSettings
          columns={allLeafColumns}
          handleResetResizing={resetColumnResizing}
          handleResetReordering={resetColumnOrder}
          handleClearToggles={setAllVisible}
        />
      )}
      <div ref={tableContainerRef} className={style.cuesheetContainer}>
        <table className={style.cuesheet}>
          <CuesheetHeader headerGroups={headerGroups} saveColumnOrder={reorder} showIndexColumn={showIndexColumn} />
          <tbody>
            {rowModel.rows.map((row) => {
              const key = row.original.id;
              const isSelected = selectedId === key;
              if (isSelected) {
                isPast = false;
              }

              if (isOntimeBlock(row.original)) {
                if (isPast && !showPrevious && key !== currentBlockId) {
                  return null;
                }
                return <BlockRow key={key} title={row.original.title} />;
              }
              if (isOntimeDelay(row.original)) {
                if (isPast && !showPrevious) {
                  return null;
                }
                const delayVal = row.original.duration;
                if (!showDelayBlock || delayVal === 0) {
                  return null;
                }

                return <DelayRow key={key} duration={delayVal} />;
              }
              if (isOntimeEvent(row.original)) {
                eventIndex++;
                const isSelected = key === selectedId;

                if (isPast && !showPrevious) {
                  return null;
                }

                let rowBgColour: string | undefined;
                if (isSelected) {
                  rowBgColour = 'var(--cuesheet-running-bg-override, #D20300)'; // $red-700
                } else if (row.original.colour) {
                  try {
                    // the colour is user defined and might be invalid
                    const accessibleBackgroundColor = Color(getAccessibleColour(row.original.colour).backgroundColor);
                    rowBgColour = accessibleBackgroundColor.fade(0.75).hexa();
                  } catch (_error) {
                    /* we do not handle errors here */
                  }
                }

                return (
                  <EventRow
                    key={key}
                    eventIndex={eventIndex}
                    isPast={isPast}
                    selectedRef={isSelected ? selectedRef : undefined}
                    skip={row.original.skip}
                    colour={row.original.colour}
                    showIndexColumn={showIndexColumn}
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
