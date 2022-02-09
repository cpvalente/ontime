import React from 'react';
import { useTable } from 'react-table';
import { Tooltip } from '@chakra-ui/tooltip';
import style from './Table.module.scss';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { stringFromMillis } from 'ontime-utils/time';
import EditableCell from './EditableCell';

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
  },
  {
    Header: 'Public',
    accessor: 'isPublic',
    Cell: ({ cell: { value } }) => (value != null ? <FiCheck /> : <FiX />),
  },
  {
    Header: 'Start',
    accessor: 'timeStart',
    Cell: ({ cell: { value } }) => stringFromMillis(value),
  },
  { Header: 'End', accessor: 'timeEnd', Cell: ({ cell: { value } }) => stringFromMillis(value) },
  {
    Header: 'Duration',
    accessor: 'duration',
    Cell: ({ cell: { value } }) => stringFromMillis(value),
  },
  { Header: 'Title', accessor: 'title' },
  { Header: 'Subtitle', accessor: 'subtitle' },
  { Header: 'Presenter', accessor: 'presenter' },
  { Header: 'Notes', accessor: 'note' },
  { Header: 'Light', accessor: 'light', Cell: EditableCell },
  { Header: 'Cam', accessor: 'cam', Cell: EditableCell },
  { Header: 'Video', accessor: 'video', Cell: EditableCell },
  { Header: 'Audio', accessor: 'audio', Cell: EditableCell },
];

export default function TestTable({ data, handleUpdate }) {
  const tableInstance = useTable({
    columns,
    data,
    handleUpdate,
  });

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;
  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => {
          const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
          return (
            <tr key={key} {...restHeaderGroupProps}>
              {headerGroup.headers.map((column) => {
                const { key, ...restColumn } = column.getHeaderProps();
                return (
                  <th key={key} {...restColumn}>
                    {column.render('Header')}
                  </th>
                );
              })}
            </tr>
          );
        })}
      </thead>
      <tbody {...getTableBodyProps}>
        {rows.map((row) => {
          prepareRow(row);
          const { key, ...restRowProps } = row.getRowProps();
          return (
            <tr key={key} {...restRowProps}>
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
  );
}
