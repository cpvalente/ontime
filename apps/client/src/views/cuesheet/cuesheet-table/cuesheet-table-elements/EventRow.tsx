import { memo, MutableRefObject, PropsWithChildren, useLayoutEffect, useRef, useState } from 'react';
import { IconButton, Menu, MenuButton } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';
import Color from 'color';

import { cx, getAccessibleColour } from '../../../../common/utils/styleUtils';
import { useCuesheetOptions } from '../../cuesheet.options';
import CuesheetTableMenu from '../cuesheet-table-menu/CuesheetTableMenu';

import style from '../CuesheetTable.module.scss';

interface EventRowProps {
  eventId: string;
  eventIndex: number;
  rowIndex: number;
  isPast?: boolean;
  selectedRef?: MutableRefObject<HTMLTableRowElement | null>;
  skip?: boolean;
  colour?: string;
  showModal: (eventId: string) => void;
}

function EventRow(props: PropsWithChildren<EventRowProps>) {
  const { children, eventId, eventIndex, rowIndex, isPast, selectedRef, skip, colour, showModal } = props;
  const { hideIndexColumn, showActionMenu } = useCuesheetOptions();
  const ownRef = useRef<HTMLTableRowElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        root: null,
        threshold: 0.01,
      },
    );

    const handleRefCurrent = ownRef.current;
    if (selectedRef) {
      setIsVisible(true);
    } else if (handleRefCurrent) {
      observer.observe(handleRefCurrent);
    }

    return () => {
      if (handleRefCurrent) {
        observer.unobserve(handleRefCurrent);
      }
    };
  }, [ownRef, selectedRef]);

  const { color, backgroundColor } = getAccessibleColour(colour);
  const mutedText = Color(color).fade(0.4).hexa();

  return (
    <tr
      className={cx([style.eventRow, skip ?? style.skip])}
      style={{ opacity: `${isPast ? '0.2' : '1'}` }}
      ref={selectedRef ?? ownRef}
    >
      {showActionMenu && (
        <td className={style.actionColumn}>
          <Menu variant='ontime-on-dark' size='sm' isLazy>
            <MenuButton
              as={IconButton}
              size='sm'
              aria-label='Options'
              icon={<IoEllipsisHorizontal />}
              variant='ontime-subtle'
            />
            <CuesheetTableMenu eventId={eventId} entryIndex={rowIndex} showModal={showModal} />
          </Menu>
        </td>
      )}
      {!hideIndexColumn && (
        <td className={style.indexColumn} style={{ backgroundColor, color: mutedText }}>
          {eventIndex}
        </td>
      )}
      {isVisible ? children : null}
    </tr>
  );
}

export default memo(EventRow);
