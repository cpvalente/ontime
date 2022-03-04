import React, { useEffect, useMemo } from 'react';
import { useBlockLayout, useColumnOrder, useResizeColumns, useTable } from 'react-table';
import { Tooltip } from '@chakra-ui/tooltip';
import { Button } from '@chakra-ui/button';
import PropTypes from 'prop-types';
import { useLocalStorage } from '../../app/hooks/useLocalStorage';
import { defaultColumnOrder } from './defaults';
import { makeColumns } from './columns';
import style from './Table.module.scss';
import EventRow from './tableRows/EventRow';
import DelayRow from './tableRows/DelayRow';
import BlockRow from './tableRows/BlockRow';

export default function OntimeTable({ data, handleUpdate, selectedId, showSettings }) {
  const columnOrder = useLocalStorage('table-order', defaultColumnOrder);
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
    resetResizing,
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

  const handleColumnReorder = () => {
    setColumnOrder(columnOrder);
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
  // keep delay
  let cumulativeDelay = 0;

  return (
    <>
      {showSettings && (
        <div className={style.tableSettings}>
          Select and order fields to show in table
          <div className={style.options}>
            {allColumns.map((column) => (
              <label key={column.id}>
                <input type='checkbox' {...column.getToggleHiddenProps()} /> {column.Header}
              </label>
            ))}
          </div>
          <br />
          <Button className={style.noPrint} onClick={resetResizing}>
            RESET RESIZING
          </Button>
        </div>
      )}
      <table {...getTableProps()} className={style.ontimeTable}>
        <thead className={style.tableHeader}>
          {headerGroups.map((headerGroup) => {
            const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
            return (
              <tr key={key} {...restHeaderGroupProps}>
                <th className={style.indexColumn}>
                  <Tooltip label='Event Order' openDelay={300}>
                    #
                  </Tooltip>
                </th>
                {headerGroup.headers.map((column) => {
                  const { key, ...restColumn } = column.getHeaderProps();
                  return (
                    <th key={key} {...restColumn}>
                      <Tooltip label={column.Header} openDelay={300}>
                        {column.render('Header')}
                      </Tooltip>
                      <div {...column.getResizerProps()} className={style.resizer} />
                    </th>
                  );
                })}
              </tr>
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
