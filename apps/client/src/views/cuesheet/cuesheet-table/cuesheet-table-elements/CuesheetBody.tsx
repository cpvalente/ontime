import { MutableRefObject } from 'react';
import { RowModel, Table } from '@tanstack/react-table';
import { isOntimeBlock, isOntimeDelay, isOntimeEvent, OntimeEntry } from 'ontime-types';
import { colourToHex, cssOrHexToColour } from 'ontime-utils';

import { useSelectedEventId } from '../../../../common/hooks/useSocket';
import { lazyEvaluate } from '../../../../common/utils/lazyEvaluate';
import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { useCuesheetOptions } from '../../../cuesheet/cuesheet.options';

import BlockRow from './BlockRow';
import DelayRow from './DelayRow';
import EventRow from './EventRow';

interface CuesheetBodyProps {
  rowModel: RowModel<OntimeEntry>;
  selectedRef: MutableRefObject<HTMLTableRowElement | null>;
  table: Table<OntimeEntry>;
}

export default function CuesheetBody({ rowModel, selectedRef, table }: CuesheetBodyProps) {
  const { selectedEventId } = useSelectedEventId();
  const { hideDelays, hidePast } = useCuesheetOptions();

  const getVisibleColumns = lazyEvaluate(() => table.getVisibleFlatColumns());
  const getColumnHash = lazyEvaluate(() => {
    let columnHash = '';
    const columns = getVisibleColumns();

    for (let i = 0; i < columns.length; i++) {
      columnHash += `${columns[i].getIndex()}-${columns[i].getSize()} `;
    }
    return columnHash;
  });

  let eventIndex = 0;
  // for the first event, it will be past if there is something selected
  let isPast = Boolean(selectedEventId);
  return (
    <tbody>
      {rowModel.rows.map((row, index) => {
        const key = row.original.id;
        const isSelected = selectedEventId === key;
        const entry = row.original;
        if (isSelected) {
          isPast = false;
        }

        if (isOntimeBlock(entry)) {
          const columnCount = getVisibleColumns().length;
          return <BlockRow columnCount={columnCount} key={key} title={entry.title} hidePast={isPast && hidePast} />;
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
          const columnHash = getColumnHash();

          if (isPast && hidePast) {
            return null;
          }

          let rowBgColour: string | undefined;
          if (isSelected) {
            rowBgColour = '#D20300'; // $red-700
          } else if (entry.colour) {
            // the colour is user defined and might be invalid
            const accessibleBackgroundColor = cssOrHexToColour(getAccessibleColour(entry.colour).backgroundColor);
            if (accessibleBackgroundColor !== null) {
              rowBgColour = colourToHex({
                ...accessibleBackgroundColor,
                alpha: accessibleBackgroundColor.alpha * 0.25,
              });
            }
          }

          return (
            <EventRow
              key={row.id}
              rowId={row.id}
              event={entry}
              eventIndex={eventIndex}
              rowIndex={index}
              isPast={isPast}
              selectedRef={isSelected ? selectedRef : undefined}
              rowBgColour={rowBgColour}
              table={table}
              columnHash={columnHash}
            />
          );
        }

        // currently there is no scenario where entryType is not handled above, either way...
        return null;
      })}
    </tbody>
  );
}
