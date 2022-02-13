import React from 'react';
import { useBlockLayout, useColumnOrder, useResizeColumns, useTable } from 'react-table';
import { Tooltip } from '@chakra-ui/tooltip';
import style from './Table.module.scss';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { stringFromMillis } from 'ontime-utils/time';
import EditableCell from './EditableCell';

export const columnOrder = [
  'type',
  'isPublic',
  'timeStart',
  'timeEnd',
  'duration',
  'title',
  'subtitle',
  'presenter',
  'note',
  'light',
  'cam',
  'video',
  'audio',
];

export const columns = [
  {
    Header: 'Type',
    accessor: 'type',
    Cell: ({ cell: { value } }) => {
      const firstCap = value.charAt(0).toUpperCase();
      const caps = firstCap + value.slice(1);
      return (
        <Tooltip label={caps} placement='right'>
          <span className={style.badge}>{firstCap}</span>
        </Tooltip>
      );
    },
    width: 20,
  },
  {
    Header: 'Public',
    accessor: 'isPublic',
    Cell: ({ cell: { value } }) => (value != null ? <FiCheck /> : <FiX />),
    width: 20,
  },
  {
    Header: 'Start',
    accessor: 'timeStart',
    Cell: ({ cell: { value } }) => stringFromMillis(value),
    width: 90,
  },
  {
    Header: 'End',
    accessor: 'timeEnd',
    Cell: ({ cell: { value } }) => stringFromMillis(value),
    width: 90,
  },
  {
    Header: 'Duration',
    accessor: 'duration',
    Cell: ({ cell: { value } }) => stringFromMillis(value),
    width: 90,
  },
  { Header: 'Title', accessor: 'title', width: 200 },
  { Header: 'Subtitle', accessor: 'subtitle', width: 150 },
  { Header: 'Presenter', accessor: 'presenter', width: 150 },
  { Header: 'Notes', accessor: 'note', width: 200 },
  { Header: 'Light', accessor: 'light', Cell: EditableCell, width: 200 },
  { Header: 'Cam', accessor: 'cam', Cell: EditableCell, width: 200 },
  { Header: 'Video', accessor: 'video', Cell: EditableCell, width: 200 },
  { Header: 'Audio', accessor: 'audio', Cell: EditableCell, width: 200 },
];

export default function TestTable({ data, handleUpdate, selectedId }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setColumnOrder,
    allColumns,
    toggleHideColumn,
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
  const handleColumnHide = () => {
    toggleHideColumn('type');
  };
  const resetResizing = () => {
    toggleHideColumn('type');
  };

  return (
    <>
      <button onClick={resetResizing}>RESET RESIZING</button>
      <button onClick={() => handleColumnReorder()}>REORDER</button>
      <button onClick={() => handleColumnHide()}>HIDE COLUMN</button>
      <div className={style.tableSettings}>
        {allColumns.map((column) => (
          <div key={column.id}>
            <label>
              <input type='checkbox' {...column.getToggleHiddenProps()} /> {column.id}
            </label>
          </div>
        ))}
        <br />
      </div>
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
                  const { key, ...restCellProps } = cell.getCellProps();
                  return (
                    <td key={key} {...restCellProps}>
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
