import { useRef } from 'react';
import { Menu } from '@chakra-ui/react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Color from 'color';
import {
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  MaybeString,
  OntimeEvent,
  OntimeRundown,
  OntimeRundownEntry,
  TimeField,
} from 'ontime-types';

import { useEventAction } from '../../../common/hooks/useEventAction';
import useFollowComponent from '../../../common/hooks/useFollowComponent';
import { useSelectedEventId } from '../../../common/hooks/useSocket';
import { getAccessibleColour } from '../../../common/utils/styleUtils';
import { useCuesheetOptions } from '../cuesheet.options';

import BlockRow from './cuesheet-table-elements/BlockRow';
import CuesheetHeader from './cuesheet-table-elements/CuesheetHeader';
import DelayRow from './cuesheet-table-elements/DelayRow';
import EventRow from './cuesheet-table-elements/EventRow';
import CuesheetTableSettings from './cuesheet-table-settings/CuesheetTableSettings';
import CuesheetTableMenu from './CuesheetTableMenu';
import useColumnManager from './useColumnManager';

import style from './CuesheetTable.module.scss';

interface CuesheetTableProps {
  data: OntimeRundown;
  columns: ColumnDef<OntimeRundownEntry>[];
  showModal: (eventId: MaybeString) => void;
}

export default function CuesheetTable(props: CuesheetTableProps) {
  const { data, columns, showModal } = props;

  const { updateEvent, updateTimer } = useEventAction();
  const { selectedEventId } = useSelectedEventId();
  const { followSelected, hideDelays, hidePast, showDelayedTimes, hideTableSeconds } = useCuesheetOptions();
  const { columnVisibility, columnOrder, columnSizing, resetColumnOrder, setColumnVisibility, setColumnSizing } =
    useColumnManager(columns);

  const selectedRef = useRef<HTMLTableRowElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  useFollowComponent({ followRef: selectedRef, scrollRef: tableContainerRef, doFollow: followSelected });

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange',
    state: {
      columnOrder,
      columnVisibility,
      columnSizing,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      handleUpdate: (rowIndex: number, accessor: string, payload: string, isCustom = false) => {
        // check if value is the same
        const event = data[rowIndex];
        if (!event || !isOntimeEvent(event)) {
          return;
        }

        // skip if there is no value change
        const key = accessor as keyof OntimeEvent;
        const previousValue = event[key];
        if (previousValue === payload) {
          return;
        }

        if (isCustom) {
          updateEvent({ id: event.id, custom: { [accessor]: payload } });
          return;
        }

        updateEvent({ id: event.id, [accessor]: payload });
      },
      handleUpdateTimer: (eventId: string, field: TimeField, payload) => {
        // the timer element already contains logic to avoid submitting a unchanged value
        updateTimer(eventId, field, payload, true);
      },
      options: {
        showDelayedTimes,
        hideTableSeconds,
      },
    },
  });

  const setAllVisible = () => {
    table.toggleAllColumnsVisible(true);
  };

  const resetColumnResizing = () => {
    setColumnSizing({});
  };

  const headerGroups = table.getHeaderGroups();
  const rowModel = table.getRowModel();
  const allLeafColumns = table.getAllLeafColumns();

  let eventIndex = 0;
  // for the first event, it will be past if there is something selected
  let isPast = Boolean(selectedEventId);

  return (
    <>
      <CuesheetTableSettings
        columns={allLeafColumns}
        handleResetResizing={resetColumnResizing}
        handleResetReordering={resetColumnOrder}
        handleClearToggles={setAllVisible}
      />
      <div ref={tableContainerRef} className={style.cuesheetContainer}>
        <table className={style.cuesheet} id='cuesheet'>
          <CuesheetHeader headerGroups={headerGroups} />
          <tbody>
            {rowModel.rows.map((row, index) => {
              const key = row.original.id;
              const isSelected = selectedEventId === key;
              const entry = row.original;
              if (isSelected) {
                isPast = false;
              }

              if (isOntimeBlock(entry)) {
                return <BlockRow key={key} title={entry.title} hidePast={isPast && hidePast} />;
              }
              if (isOntimeDelay(entry)) {
                if (isPast && hidePast) {
                  return null;
                }
                const delayVal = entry.duration;
                if (hideDelays || delayVal === 0) {
                  return null;
                }

                return <DelayRow key={key} duration={delayVal} />;
              }
              if (isOntimeEvent(entry)) {
                eventIndex++;
                const isSelected = key === selectedEventId;

                if (isPast && hidePast) {
                  return null;
                }

                let rowBgColour: string | undefined;
                if (isSelected) {
                  rowBgColour = '#D20300'; // $red-700
                } else if (entry.colour) {
                  try {
                    // the colour is user defined and might be invalid
                    const accessibleBackgroundColor = Color(getAccessibleColour(entry.colour).backgroundColor);
                    rowBgColour = accessibleBackgroundColor.fade(0.75).hexa();
                  } catch (_error) {
                    /* we do not handle errors here */
                  }
                }

                return (
                  <Menu key={key} variant='ontime-on-dark' size='sm' isLazy>
                    <EventRow
                      eventIndex={eventIndex}
                      isPast={isPast}
                      selectedRef={isSelected ? selectedRef : undefined}
                      skip={entry.skip}
                      colour={entry.colour}
                    >
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <td key={cell.id} style={{ width: cell.column.getSize(), backgroundColor: rowBgColour }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </EventRow>
                    <CuesheetTableMenu event={entry} entryIndex={index} showModal={showModal} />
                  </Menu>
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
