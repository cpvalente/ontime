import { useContext } from 'react';
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
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { OntimeBlock, OntimeDelay, OntimeRundown, OntimeRundownEntry, SupportedEvent } from 'ontime-types';

import { TableSettingsContext } from '../../common/context/TableSettingsContext';
import { useLocalStorage } from '../../common/hooks/useLocalStorage';
import { millisToDelayString } from '../../common/utils/dateConfig';
import { tooltipDelayFast } from '../../ontimeConfig';

import { CuesheetSettings } from './table-settings/TableSettings';
import { DraggableColumnHeader } from './tableElements/SortableCell';
import { initialColumnOrder } from './cuesheetCols';

interface CuesheetProps {
  data: OntimeRundown;
  columns: ColumnDef<OntimeRundownEntry>[];
  handleUpdate: (rowIndex: number, accessor: keyof OntimeRundownEntry, payload: unknown) => void;
}

export default function Cuesheet({ data, columns, handleUpdate }: CuesheetProps) {
  const { followSelected, showSettings } = useContext(TableSettingsContext);
  const [columnVisibility, setColumnVisibility] = useLocalStorage('table-hidden', {});
  const [columnOrder, saveColumnOrder] = useLocalStorage<string[]>('table-order', initialColumnOrder);
  const [columnSizing, setColumnSizing] = useLocalStorage('table-sizes', {});

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

  const resetColumnOrder = () => {
    saveColumnOrder(initialColumnOrder);
  };

  const setAllVisible = () => {
    table.toggleAllColumnsVisible(true);
  };

  const resetColumnResizing = () => {
    setColumnSizing({});
  };

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
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => {
            const key = headerGroup.id;

            return (
              <DndContext key={key} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOnDragEnd}>
                <tr key={headerGroup.id}>
                  <th>
                    <Tooltip label='Event Order' openDelay={tooltipDelayFast}>
                      #
                    </Tooltip>
                  </th>
                  <SortableContext key={key} items={headerGroup.headers} strategy={horizontalListSortingStrategy}>
                    {headerGroup.headers.map((header) => {
                      const width = header.getSize();

                      return (
                        <DraggableColumnHeader key={header.column.columnDef.id} header={header} style={{ width }}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </DraggableColumnHeader>
                      );
                    })}
                  </SortableContext>
                </tr>
              </DndContext>
            );
          })}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => {
            const entryType = row.original.type as SupportedEvent;

            if (entryType === SupportedEvent.Block) {
              const title = (row.original as OntimeBlock).title;

              return (
                <tr key={row.id}>
                  <td>{title}</td>
                </tr>
              );
            }
            if (entryType === SupportedEvent.Delay) {
              const delayVal = (row.original as OntimeDelay).duration;
              const delayTime = delayVal !== 0 ? millisToDelayString(delayVal) : null;
              return (
                <tr key={row.id}>
                  <td>{delayTime}</td>
                </tr>
              );
            }

            if (entryType === SupportedEvent.Event) {
              const id = row.id;

              // user facing indexes are 1 based
              const index = row.index + 1;

              return (
                <tr key={id}>
                  <td>{index}</td>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    </>
  );
}
