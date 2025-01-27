import { MutableRefObject } from 'react';
import { Menu } from '@chakra-ui/react';
import { flexRender, RowModel } from '@tanstack/react-table';
import Color from 'color';
import { isOntimeBlock, isOntimeDelay, isOntimeEvent, MaybeString, OntimeRundownEntry } from 'ontime-types';

import { useSelectedEventId } from '../../../../common/hooks/useSocket';
import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { useCuesheetOptions } from '../../../cuesheet/cuesheet.options';
import CuesheetTableMenu from '../CuesheetTableMenu';

import BlockRow from './BlockRow';
import DelayRow from './DelayRow';
import EventRow from './EventRow';

interface CuesheetBodyProps {
  rowModel: RowModel<OntimeRundownEntry>;
  selectedRef: MutableRefObject<HTMLTableRowElement | null>;
  showModal: (eventId: MaybeString) => void;
}

export default function CuesheetBody(props: CuesheetBodyProps) {
  const { rowModel, selectedRef, showModal } = props;

  const { selectedEventId } = useSelectedEventId();
  const { hideDelays, hidePast } = useCuesheetOptions();

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
                    <td key={cell.id} style={{ width: cell.column.getSize(), backgroundColor: rowBgColour }} tabIndex={-1} role='gridcell'>
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
  );
}
