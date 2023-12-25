import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

import useRundown from '../../common/hooks-query/useRundown';

import './Table.scss';

const columns: ColumnDef<OntimeRundownEntry, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'colour', header: '' },
];

export default function Table() {
  const { data } = useRundown();
  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <table style={{ width: table.getTotalSize() }}>
        <thead>
          {table.getHeaderGroups().map((headerGroups) => {
            return (
              <tr key={headerGroups.id}>
                {headerGroups.headers.map((header) => {
                  return (
                    <th key={header.id} style={{ width: header.getSize() }}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`resizeHandle${header.column.getIsResizing() ? ' isResizing' : ''}`}
                      />
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id} style={{ width: cell.column.getSize() }}>
                      <span>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
