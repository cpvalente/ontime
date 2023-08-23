import { MutableRefObject, useEffect, useRef } from 'react';
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
import { isOntimeBlock, isOntimeDelay, isOntimeEvent, OntimeRundown, OntimeRundownEntry } from 'ontime-types';

import { useLocalStorage } from '../../common/hooks/useLocalStorage';
import { millisToDelayString } from '../../common/utils/dateConfig';
import { getAccessibleColour } from '../../common/utils/styleUtils';
import { tooltipDelayFast } from '../../ontimeConfig';

import CuesheetTableSettings from './cuesheet-table-settings/CuesheetTableSettings';
import { useCuesheetSettings } from './store/CuesheetSettings';
import { SortableCell } from './tableElements/SortableCell';
import { initialColumnOrder } from './cuesheetCols';

import style from './Cuesheet.module.scss';

const pastOpacity = '0.2';

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

  // when selection moves, view should follow
  useEffect(() => {
    function scrollToComponent(
      componentRef: MutableRefObject<HTMLTableRowElement>,
      scrollRef: MutableRefObject<HTMLDivElement>,
    ) {
      const componentRect = componentRef.current.getBoundingClientRect();
      const scrollRect = scrollRef.current.getBoundingClientRect();
      const top = componentRect.top - scrollRect.top + scrollRef.current.scrollTop - 100;
      scrollRef.current.scrollTo({ top, behavior: 'smooth' });
    }

    if (!followSelected) {
      return;
    }

    if (selectedRef.current && tableContainerRef.current) {
      // Use requestAnimationFrame to ensure the component is fully loaded
      window.requestAnimationFrame(() => {
        scrollToComponent(
          selectedRef as MutableRefObject<HTMLTableRowElement>,
          tableContainerRef as MutableRefObject<HTMLDivElement>,
        );
      });
    }
    // eslint-disable-next-line -- the prompt seems incorrect, we need the refs
  }, [selectedRef.current, tableContainerRef.current, followSelected]);

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
            {table.getRowModel().rows.map((row) => {
              const key = row.original.id;
              const isSelected = selectedId === key;
              if (isSelected) {
                isPast = false;
              }

              if (isOntimeBlock(row.original)) {
                const title = row.original.title;

                return (
                  <tr key={key} className={style.blockRow}>
                    <td>{title}</td>
                  </tr>
                );
              }
              if (isOntimeDelay(row.original)) {
                const delayVal = row.original.duration;

                if (!showDelayBlock || delayVal === 0) {
                  return null;
                }

                const delayTime = millisToDelayString(delayVal);
                return (
                  <tr key={key} className={style.delayRow}>
                    <td>{delayTime}</td>
                  </tr>
                );
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

                const bgFallback = 'transparent';
                const bgColour = row.original.colour || bgFallback;
                const textColour = bgColour === bgFallback ? undefined : getAccessibleColour(bgColour);
                const isSkipped = row.original.skip;

                let rowBgColour: string | undefined;
                if (row.original.id === selectedId) {
                  rowBgColour = '#D20300'; // $red-700
                }
                return (
                  <tr
                    key={key}
                    className={`${style.eventRow} ${isSkipped ? style.skip : ''}`}
                    style={{ opacity: `${isPast ? pastOpacity : '1'}` }}
                    ref={isSelected ? selectedRef : undefined}
                  >
                    <td className={style.indexColumn} style={{ backgroundColor: bgColour, color: textColour?.color }}>
                      {eventIndex}
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

              // currently there is no scenario where entryType is not handled above, either way...
              return null;
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
