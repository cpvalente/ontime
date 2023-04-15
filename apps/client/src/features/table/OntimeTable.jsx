import { useCallback, useContext, useEffect, useMemo } from 'react';
import { useBlockLayout, useColumnOrder, useResizeColumns, useTable } from 'react-table';
import { Tooltip } from '@chakra-ui/react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import PropTypes from 'prop-types';

import { TableSettingsContext } from '../../common/context/TableSettingsContext';
import { useLocalStorage } from '../../common/hooks/useLocalStorage';
import { tooltipDelayFast } from '../../ontimeConfig';

import SortableCell from './tableElements/SortableCell';
import TableSettings from './tableElements/TableSettings';
import BlockRow from './tableRows/BlockRow';
import DelayRow from './tableRows/DelayRow';
import EventRow from './tableRows/EventRow';
import { makeColumns } from './columns';
import { defaultColumnOrder, defaultHiddenColumns } from './defaults';

import style from './Table.module.scss';

export default function OntimeTable({ tableData, userFields, selectedId, handleUpdate }) {
  const { followSelected, showSettings } = useContext(TableSettingsContext);
  const [columnOrder, saveColumnOrder] = useLocalStorage('table-order', defaultColumnOrder);
  const [columnSize, saveColumnSize] = useLocalStorage('table-sizes', {});
  const [hiddenColumns, saveHiddenColumns] = useLocalStorage('table-hidden', defaultHiddenColumns);
  const columns = useMemo(() => makeColumns(columnSize, userFields), [columnSize, userFields]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setColumnOrder,
    allColumns,
    setHiddenColumns,
    toggleHideAllColumns,
    state,
  } = useTable(
    {
      columns,
      data: tableData,
      initialState: {
        hiddenColumns,
      },
      handleUpdate,
    },
    useColumnOrder,
    useBlockLayout,
    useResizeColumns
  );

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
    })
  );

  const handleResetReordering = useCallback(() => {
    saveColumnOrder(defaultColumnOrder);
    setColumnOrder(defaultColumnOrder);
  }, [saveColumnOrder, setColumnOrder]);

  const handleResetResizing = useCallback(() => {
    saveColumnSize({});
  }, [saveColumnSize]);

  const handleResetToggles = useCallback(() => {
    setHiddenColumns(defaultHiddenColumns);
    saveHiddenColumns(defaultHiddenColumns);
  }, [saveHiddenColumns, setHiddenColumns]);

  const clearToggles = useCallback(() => {
    toggleHideAllColumns(false);
    saveHiddenColumns([]);
  }, [saveHiddenColumns, toggleHideAllColumns]);

  const handleOnDragEnd = useCallback((event) => {
    const { delta, active, over } = event;

    // cancel if delta y is greater than 200
    if (delta.y > 200) return;

    const cols = [...columnOrder];

    // get index of from
    const fromIndex = cols.findIndex((i) => i === active.id);

    // get index of to
    const toIndex = cols.findIndex((i) => i === over.id);

    if (toIndex === -1) {
      return;
    }

    // reorder
    const [reorderedItem] = cols.splice(fromIndex, 1);
    cols.splice(toIndex, 0, reorderedItem);

    saveColumnOrder(cols);
    setColumnOrder(cols);
  }, [columnOrder, saveColumnOrder, setColumnOrder]);

  // save hidden columns object to local storage
  useEffect(() => {
    saveHiddenColumns(state.hiddenColumns);
  }, [saveHiddenColumns, state.hiddenColumns]);

  // save column sizes to local storage
  useEffect(() => {
    // property changes from title of column to null on resize end
    if (state.columnResizing?.isResizingColumn !== null) {
      return;
    }
    const cols = state.columnResizing.columnWidths;
    saveColumnSize((prev) => ({ ...prev, ...cols }));
  }, [saveColumnSize, state.columnResizing]);

  // scroll to active cue
  useEffect(() => {
    if (followSelected) {
      const el = document.getElementById(selectedId);
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }
  }, [followSelected, selectedId]);

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
          handleClearToggles={clearToggles}
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
                    <Tooltip label='Event Order' openDelay={tooltipDelayFast}>
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
          {/*This is saving in place of a default component*/}
          {/* eslint-disable-next-line array-callback-return */}
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
  tableData: PropTypes.array,
  userFields: PropTypes.object,
  handleUpdate: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
  showSettings: PropTypes.bool,
  followSelected: PropTypes.bool,
};
