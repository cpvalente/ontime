import { memo, MutableRefObject, PropsWithChildren, useLayoutEffect, useRef, useState } from 'react';
import { IconButton } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';
import Color from 'color';

import { cx, getAccessibleColour } from '../../../../common/utils/styleUtils';
import { useCuesheetOptions } from '../../cuesheet.options';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';

import style from '../CuesheetTable.module.scss';

interface EventRowProps {
  eventId: string;
  eventIndex: number;
  rowIndex: number;
  isPast?: boolean;
  selectedRef?: MutableRefObject<HTMLTableRowElement | null>;
  skip?: boolean;
  colour?: string;
}

function EventRow(props: PropsWithChildren<EventRowProps>) {
  const { children, eventId, eventIndex, rowIndex, isPast, selectedRef, skip, colour } = props;
  const { hideIndexColumn, showActionMenu } = useCuesheetOptions();
  const ownRef = useRef<HTMLTableRowElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { openMenu } = useCuesheetTableMenu();

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
          <IconButton
            size='sm'
            aria-label='Options'
            icon={<IoEllipsisHorizontal />}
            variant='ontime-subtle'
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const yPos = 8 + rect.y + rect.height / 2;
              openMenu({ x: rect.x, y: yPos }, eventId, rowIndex);
            }}
          />
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
