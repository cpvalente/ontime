import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { OntimeBlock, OntimeDelay, OntimeRundown, OntimeRundownEntry, SupportedEvent } from 'ontime-types';

import { millisToDelayString } from '../../common/utils/dateConfig';

interface CuesheetProps {
  data: OntimeRundown;
  columns: ColumnDef<OntimeRundownEntry>[];
  handleUpdate: (rowIndex: number, accessor: keyof OntimeRundownEntry, payload: unknown) => void;
}

export default function Cuesheet({ data, columns, handleUpdate }: CuesheetProps) {
  // TODO: remove debug stuff
  const table = useReactTable({
    data,
    columns,
    meta: {
      handleUpdate,
    },
    getCoreRowModel: getCoreRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th colSpan={header.colSpan} key={header.column.columnDef.id}>
                <div>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </div>
              </th>
            ))}
          </tr>
        ))}
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
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            );
          }
        })}
      </tbody>
    </table>
  );
}
