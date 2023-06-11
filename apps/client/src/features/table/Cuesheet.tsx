import { useContext } from 'react';
import { Tooltip } from '@chakra-ui/react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { OntimeBlock, OntimeDelay, OntimeRundown, OntimeRundownEntry, SupportedEvent } from 'ontime-types';

import { TableSettingsContext } from '../../common/context/TableSettingsContext';
import { useLocalStorage } from '../../common/hooks/useLocalStorage';
import { millisToDelayString } from '../../common/utils/dateConfig';
import { tooltipDelayFast } from '../../ontimeConfig';

import { CuesheetSettings } from './table-settings/TableSettings';

interface CuesheetProps {
  data: OntimeRundown;
  columns: ColumnDef<OntimeRundownEntry>[];
  handleUpdate: (rowIndex: number, accessor: keyof OntimeRundownEntry, payload: unknown) => void;
}

export default function Cuesheet({ data, columns, handleUpdate }: CuesheetProps) {
  const { followSelected, showSettings } = useContext(TableSettingsContext);
  const [columnVisibility, setColumnVisibility] = useLocalStorage('table-hidden', {});

  // TODO: remove debug stuff
  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
    },
    meta: {
      handleUpdate,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });

  const setAllVisible = () => {
    table.toggleAllColumnsVisible(true);
  };

  return (
    <>
      {showSettings && (
        <CuesheetSettings
          columns={table.getAllLeafColumns()}
          handleResetResizing={() => console.log('reset resize')}
          handleResetReordering={() => console.log('reset reorder')}
          handleClearToggles={setAllVisible}
        />
      )}
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              <th>
                <Tooltip label='Event Order' openDelay={tooltipDelayFast}>
                  #
                </Tooltip>
              </th>
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
