import React, { useCallback, useEffect, useMemo } from 'react';
import { useBlockLayout, useColumnOrder, useResizeColumns, useTable } from 'react-table';
import { Tooltip } from '@chakra-ui/tooltip';
import PropTypes from 'prop-types';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useLocalStorage } from '../../app/hooks/useLocalStorage';
import { defaultColumnOrder } from './defaults';
import { makeColumns } from './columns';
import style from './Table.module.scss';
import EventRow from './tableRows/EventRow';
import DelayRow from './tableRows/DelayRow';
import BlockRow from './tableRows/BlockRow';
import SortableCell from './tableElements/SortableCell';
import TableSettings from './tableElements/TableSettings';

export default function OntimeTable({ data, handleUpdate, selectedId, showSettings }) {
  const [columnOrder, saveColumnOrder] = useLocalStorage('table-order', defaultColumnOrder);
  const [columnSize, setColumnSize] = useLocalStorage('table-sizes', {});
  const columns = useMemo(() => makeColumns(columnSize), [columnSize]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setColumnOrder,
    allColumns,
    toggleHideAllColumns,
    state,
  } = useTable(
    {
      columns,
      data,
      handleUpdate,
    },
    useColumnOrder,
    useBlockLayout,
    useResizeColumns
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 300,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleResetReordering = useCallback(() => {
    saveColumnOrder(defaultColumnOrder);
    setColumnOrder(defaultColumnOrder);
  }, [saveColumnOrder, setColumnOrder]);

  const handleResetResizing = useCallback(() => {
    setColumnSize({});
  }, [setColumnSize]);

  const handleResetToggles = useCallback(() => {
    console.log('reset toggles');
    // Todo: column visibility in localstorage?
    toggleHideAllColumns(false);
  }, [toggleHideAllColumns]);

  const handleOnDragEnd = (event) => {
    const { delta, active, over } = event;

    // cancel if delta y is greater than 200
    if (delta.y > 200) return;

    // create temp object
    const cols = [...columnOrder];

    // get index of from
    const fromIndex = cols.findIndex((i) => i === active.id);

    // get index of to
    const toIndex = cols.findIndex((i) => i === over.id);

    // reorder
    const [reorderedItem] = cols.splice(fromIndex, 1);
    cols.splice(toIndex, 0, reorderedItem);

    saveColumnOrder(cols);
    setColumnOrder(cols);
  };

  // save column sizes to localstorage
  useEffect(() => {
    // property changes from title of column to null on resize end
    if (state.columnResizing?.isResizingColumn !== null) {
      return;
    }
    const cols = state.columnResizing.columnWidths;
    setColumnSize((prev) => ({ ...prev, ...cols }));
  }, [setColumnSize, state.columnResizing]);

  // keep order of events
  let eventIndex = 0;
  // keep delay (ms)
  let cumulativeDelay = 0;

  return (
    <>
      {showSettings && (
        <TableSettings
          columns={allColumns}
          handleResetResizing={handleResetResizing}
          handleResetReordering={handleResetReordering}
          handleResetToggles={handleResetToggles}
        />
      )}
      <table {...getTableProps()} className={style.ontimeTable}>
        <thead className={style.tableHeader}>
          {headerGroups.map((headerGroup) => {
            const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
            return (
              <DndContext
                key={key}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleOnDragEnd}
              >
                <tr {...restHeaderGroupProps}>
                  <th className={style.indexColumn}>
                    <Tooltip label='Event Order' openDelay={300}>
                      #
                    </Tooltip>
                  </th>
                  <SortableContext
                    key={key}
                    items={headerGroup.headers}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map((column) => {
                      const { key } = column.getHeaderProps();
                      return <SortableCell key={key} column={column} />;
                    })}
                  </SortableContext>
                </tr>
              </DndContext>
            );
          })}
        </thead>
        <tbody {...getTableBodyProps} className={style.tableBody}>
          {rows.map((row) => {
            prepareRow(row);
            const { key } = row.getRowProps();
            const type = row.original.type;
            if (type === 'event') {
              eventIndex++;
              return (
                <EventRow
                  key={key}
                  row={row}
                  index={eventIndex}
                  selectedId={selectedId}
                  delay={cumulativeDelay}
                />
              );
            }
            if (type === 'delay') {
              if (row.original.duration != null) {
                cumulativeDelay += row.original.duration;
              }
              return <DelayRow key={key} row={row} />;
            }
            if (type === 'block') {
              cumulativeDelay = 0;
              return <BlockRow key={key} row={row} />;
            }
          })}
        </tbody>
      </table>
    </>
  );
}

OntimeTable.propTypes = {
  data: PropTypes.array,
  handleUpdate: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
  showSettings: PropTypes.bool,
};
