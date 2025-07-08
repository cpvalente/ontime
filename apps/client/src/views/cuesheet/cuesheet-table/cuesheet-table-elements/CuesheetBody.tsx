import { RefObject, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RowModel, Table } from '@tanstack/react-table';
import {
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  isOntimeMilestone,
  OntimeBlock,
  OntimeEntry,
  Rundown,
} from 'ontime-types';
import { colourToHex, cssOrHexToColour } from 'ontime-utils';

import { RUNDOWN } from '../../../../common/api/constants';
import { useSelectedEventId } from '../../../../common/hooks/useSocket';
import { lazyEvaluate } from '../../../../common/utils/lazyEvaluate';
import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';

import BlockRow from './BlockRow';
import DelayRow from './DelayRow';
import EventRow from './EventRow';
import MilestoneRow from './MilestoneRow';
import { cleanup } from './rowObserver';

interface CuesheetBodyProps {
  rowModel: RowModel<OntimeEntry>;
  selectedRef: RefObject<HTMLTableRowElement>;
  table: Table<OntimeEntry>;
}

export default function CuesheetBody({ rowModel, selectedRef, table }: CuesheetBodyProps) {
  const queryClient = useQueryClient();
  const { selectedEventId } = useSelectedEventId();
  const hidePast = usePersistedCuesheetOptions((state) => state.hidePast);
  const hideDelays = usePersistedCuesheetOptions((state) => state.hideDelays);

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
  let hadBlock = false;

  // remove the observer when the table unmounts
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

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
          return (
            <BlockRow
              key={key}
              blockId={entry.id}
              colour={entry.colour}
              hidePast={isPast && hidePast}
              rowId={row.id}
              rowIndex={row.index}
              table={table}
            />
          );
        }
        if (isOntimeDelay(entry)) {
          if (isPast && hidePast) {
            return null;
          }
          const delayVal = entry.duration;
          if (hideDelays || delayVal === 0) {
            return null;
          }

          let parentBgColour: string | null = null;
          if (entry.parent) {
            const rundown = queryClient.getQueryData<Rundown>(RUNDOWN);
            const parentEntry = rundown?.entries[entry.parent];
            parentBgColour = (parentEntry as OntimeBlock).colour ?? null;
          }
          return <DelayRow key={key} duration={delayVal} parentBgColour={parentBgColour} />;
        }
        if (isOntimeMilestone(entry)) {
          if (isPast && hidePast) {
            return null;
          }

          let rowBgColour: string | undefined;
          if (entry.colour) {
            // the colour is user defined and might be invalid
            const accessibleBackgroundColor = cssOrHexToColour(getAccessibleColour(entry.colour).backgroundColor);
            if (accessibleBackgroundColor !== null) {
              rowBgColour = colourToHex({
                ...accessibleBackgroundColor,
                alpha: accessibleBackgroundColor.alpha * 0.25,
              });
            }
          }

          let parentBgColour: string | null = null;
          if (entry.parent) {
            const rundown = queryClient.getQueryData<Rundown>(RUNDOWN);
            const parentEntry = rundown?.entries[entry.parent];
            parentBgColour = (parentEntry as OntimeBlock).colour ?? null;
          }

          return (
            <MilestoneRow
              key={key}
              entryId={entry.id}
              isPast={isPast}
              parentBgColour={parentBgColour}
              parentId={entry.parent}
              rowBgColour={rowBgColour}
              rowId={row.id}
              rowIndex={index}
              table={table}
            />
          );
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
            rowBgColour = '#087A27'; // $active-green
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

          let parentBgColour: string | undefined;
          let firstAfterBlock = false;
          if (entry.parent) {
            const rundown = queryClient.getQueryData<Rundown>(RUNDOWN);
            const parentEntry = rundown?.entries[entry.parent] as OntimeBlock | undefined;
            parentBgColour = parentEntry?.colour;
            hadBlock = true;
          } else if (hadBlock) {
            firstAfterBlock = true;
            hadBlock = false;
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
              parentBgColour={parentBgColour}
              table={table}
              firstAfterBlock={firstAfterBlock}
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
