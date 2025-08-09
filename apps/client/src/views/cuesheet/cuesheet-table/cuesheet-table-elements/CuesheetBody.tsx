import { RefObject, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RowModel, Table } from '@tanstack/react-table';
import {
  isOntimeDelay,
  isOntimeEvent,
  isOntimeGroup,
  isOntimeMilestone,
  OntimeEntry,
  OntimeGroup,
  Rundown,
} from 'ontime-types';
import { colourToHex, cssOrHexToColour } from 'ontime-utils';

import { RUNDOWN } from '../../../../common/api/constants';
import EmptyTableBody from '../../../../common/components/state/EmptyTableBody';
import { useSelectedEventId } from '../../../../common/hooks/useSocket';
import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';

import DelayRow from './DelayRow';
import EventRow from './EventRow';
import GroupRow from './GroupRow';
import MilestoneRow from './MilestoneRow';
import { cleanup } from './rowObserver';

interface CuesheetBodyProps {
  rowModel: RowModel<OntimeEntry>;
  selectedRef: RefObject<HTMLTableRowElement | null>;
  table: Table<OntimeEntry>;
}

export default function CuesheetBody({ rowModel, selectedRef, table }: CuesheetBodyProps) {
  const queryClient = useQueryClient();
  const { selectedEventId } = useSelectedEventId();
  const hidePast = usePersistedCuesheetOptions((state) => state.hidePast);
  const hideDelays = usePersistedCuesheetOptions((state) => state.hideDelays);

  let eventIndex = 0;
  // for the first event, it will be past if there is something selected
  let isPast = Boolean(selectedEventId);
  let hadGroup = false;

  // remove the observer when the table unmounts
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  if (rowModel.rows.length === 0) {
    return <EmptyTableBody text='No data in rundown' />;
  }

  return (
    <tbody>
      {rowModel.rows.map((row, index) => {
        const key = row.original.id;
        const isSelected = selectedEventId === key;
        const entry = row.original;
        if (isSelected) {
          isPast = false;
        }

        if (isOntimeGroup(entry)) {
          return (
            <GroupRow
              key={key}
              groupId={entry.id}
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
            const parentEntry = rundown?.entries[entry.parent] as OntimeGroup | undefined;
            parentBgColour = parentEntry?.colour ?? null;
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
            parentBgColour = (parentEntry as OntimeGroup | undefined)?.colour ?? null;
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
          let firstAfterGroup = false;
          if (entry.parent) {
            const rundown = queryClient.getQueryData<Rundown>(RUNDOWN);
            const parentEntry = rundown?.entries[entry.parent] as OntimeGroup | undefined;
            parentBgColour = parentEntry?.colour;
            hadGroup = true;
          } else if (hadGroup) {
            firstAfterGroup = true;
            hadGroup = false;
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
              firstAfterGroup={firstAfterGroup}
            />
          );
        }

        // currently there is no scenario where entryType is not handled above, either way...
        return null;
      })}
    </tbody>
  );
}
