import { useContext, useRef } from 'react';
import { useVirtual } from 'react-virtual';
import { Tooltip } from '@chakra-ui/react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ColumnDef, flexRender, getCoreRowModel, Row, useReactTable } from '@tanstack/react-table';
import { OntimeBlock, OntimeDelay, OntimeEvent, OntimeRundown, OntimeRundownEntry, SupportedEvent } from 'ontime-types';

import { TableSettingsContext } from '../../common/context/TableSettingsContext';
import { useLocalStorage } from '../../common/hooks/useLocalStorage';
import { millisToDelayString } from '../../common/utils/dateConfig';
import { getAccessibleColour } from '../../common/utils/styleUtils';
import { tooltipDelayFast } from '../../ontimeConfig';

import { CuesheetSettings } from './table-settings/TableSettings';
import { SortableCell } from './tableElements/SortableCell';
import { initialColumnOrder } from './cuesheetCols';

import style from './Cuesheet.module.scss';

interface CuesheetProps {
  data: OntimeRundown;
  columns: ColumnDef<OntimeRundownEntry>[];
  handleUpdate: (rowIndex: number, accessor: keyof OntimeRundownEntry, payload: unknown) => void;
  selectedId: string | null;
}

export default function Cuesheet({ data, columns, handleUpdate, selectedId }: CuesheetProps) {
  const { followSelected, showSettings } = useContext(TableSettingsContext);
  const [columnVisibility, setColumnVisibility] = useLocalStorage('table-hidden', {});
  const [columnOrder, saveColumnOrder] = useLocalStorage<string[]>('table-order', initialColumnOrder);
  const [columnSizing, setColumnSizing] = useLocalStorage('table-sizes', {});

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
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    overscan: 10,
  });
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 50,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 50,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleOnDragEnd = (event: DragEndEvent) => {
    const { delta, active, over } = event;

    // cancel if delta y is greater than 200
    if (delta.y > 200) return;
    // cancel if we do not have an over id
    if (over?.id == null) return;

    // get index of from
    const fromIndex = columnOrder.indexOf(active.id as string);

    // get index of to
    const toIndex = columnOrder.indexOf(over.id as string);

    if (toIndex === -1) {
      return;
    }

    const reorderedCols = [...columnOrder];
    const reorderedItem = reorderedCols.splice(fromIndex, 1);
    reorderedCols.splice(toIndex, 0, reorderedItem[0]);

    saveColumnOrder(reorderedCols);
  };

  const resetColumnOrder = () => {
    saveColumnOrder(initialColumnOrder);
  };

  const setAllVisible = () => {
    table.toggleAllColumnsVisible(true);
  };

  const resetColumnResizing = () => {
    setColumnSizing({});
  };

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0) : 0;

  return (
    <>
      {showSettings && (
        <CuesheetSettings
          columns={table.getAllLeafColumns()}
          handleResetResizing={resetColumnResizing}
          handleResetReordering={resetColumnOrder}
          handleClearToggles={setAllVisible}
        />
      )}
      <div ref={tableContainerRef} className={style.cuesheetContainer}>
        <table className={style.cuesheet}>
          <thead className={style.tableHeader}>
            {table.getHeaderGroups().map((headerGroup) => {
              const key = headerGroup.id;

              return (
                <DndContext key={key} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOnDragEnd}>
                  <tr key={headerGroup.id}>
                    <th className={style.indexColumn}>
                      <Tooltip label='Event Order' openDelay={tooltipDelayFast}>
                        #
                      </Tooltip>
                    </th>
                    <SortableContext key={key} items={headerGroup.headers} strategy={horizontalListSortingStrategy}>
                      {headerGroup.headers.map((header) => {
                        const width = header.getSize();

                        return (
                          <SortableCell key={header.column.columnDef.id} header={header} style={{ width }}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </SortableCell>
                        );
                      })}
                    </SortableContext>
                  </tr>
                </DndContext>
              );
            })}
          </thead>

          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}

            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index] as Row<OntimeRundownEntry>;
              const entryType = row.original.type as SupportedEvent;

              if (entryType === SupportedEvent.Block) {
                const title = (row.original as OntimeBlock).title;

                return (
                  <tr key={row.id} className={style.blockRow}>
                    <td colSpan={99}>{title}</td>
                  </tr>
                );
              }
              if (entryType === SupportedEvent.Delay) {
                const delayVal = (row.original as OntimeDelay).duration;
                if (delayVal === 0) {
                  return null;
                }
                const delayTime = millisToDelayString(delayVal);
                return (
                  <tr key={row.id} className={style.delayRow}>
                    <td colSpan={99}>{delayTime}</td>
                  </tr>
                );
              }

              if (entryType === SupportedEvent.Event) {
                const id = row.id;

                // user facing indexes are 1 based
                const index = row.index + 1;

                const bgFallback = 'transparent';
                const bgColour = (row.original as OntimeEvent).colour || bgFallback;
                const textColour = bgColour === bgFallback ? undefined : getAccessibleColour(bgColour);

                let rowBgColour: string | undefined;
                if (row.original.id === selectedId) {
                  rowBgColour = '#D20300'; // $red-700
                }

                return (
                  <tr key={id} className={style.eventRow}>
                    <td className={style.indexColumn} style={{ backgroundColor: bgColour, color: textColour?.color }}>
                      {index}
                    </td>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td key={cell.id} style={{ width: cell.column.getSize(), backgroundColor: rowBgColour }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              }
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
