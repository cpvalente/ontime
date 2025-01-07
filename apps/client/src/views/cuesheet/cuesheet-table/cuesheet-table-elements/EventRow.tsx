import { memo, MutableRefObject, PropsWithChildren, useLayoutEffect, useRef, useState } from 'react';
import { IoEllipsisHorizontal } from 'react-icons/io5';
import Color from 'color';

import { IconButton } from '../../../../common/components/ui/icon-button';
import { cx, getAccessibleColour } from '../../../../common/utils/styleUtils';
import { useCuesheetOptions } from '../../cuesheet.options';

import style from '../CuesheetTable.module.scss';

interface EventRowProps {
  eventIndex: number;
  isPast?: boolean;
  selectedRef?: MutableRefObject<HTMLTableRowElement | null>;
  skip?: boolean;
  colour?: string;
}

function EventRow(props: PropsWithChildren<EventRowProps>) {
  const { children, eventIndex, isPast, selectedRef, skip, colour } = props;
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
          <IconButton size='sm' aria-label='Options' variant='ontime-subtle'>
            <IoEllipsisHorizontal />
          </IconButton>
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
