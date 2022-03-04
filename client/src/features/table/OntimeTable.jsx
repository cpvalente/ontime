import React, { useEffect, useMemo } from 'react';
import { useBlockLayout, useColumnOrder, useResizeColumns, useTable } from 'react-table';
import { Tooltip } from '@chakra-ui/tooltip';
import { Button } from '@chakra-ui/button';
import PropTypes from 'prop-types';
import { useLocalStorage } from '../../app/hooks/useLocalStorage';
import { defaultColumnOrder } from './defaults';
import { makeColumns } from './columns';
import style from './Table.module.scss';

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
        {rows.map((row, index) => {
          prepareRow(row);
          const { key, ...restRowProps } = row.getRowProps();
          const selected = row.original.id === selectedId;
          return (
            <tr key={key} {...restRowProps} className={selected ? style.selected : ''}>
              <td className={style.indexColumn}>{index + 1}</td>
              {row.cells.map((cell) => {
                const { key, style, ...restCellProps } = cell.getCellProps();
                return (
                  <td
                    key={key}
                    style={{ ...style, backgroundColor: row.original.colour || 'none' }}
                    {...restCellProps}
                  >
                    {cell.render('Cell')}
                  </td>
                );
              })}
            </tr>
          );
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
