import { memo, MutableRefObject, PropsWithChildren, useLayoutEffect, useRef, useState } from 'react';

import { getAccessibleColour } from '../../../common/utils/styleUtils';

import style from '../Cuesheet.module.scss';

const pastOpacity = '0.2';

interface EventRowProps {
  eventIndex: number;
  isPast?: boolean;
  selectedRef?: MutableRefObject<HTMLTableRowElement | null>;
  skip?: boolean;
  colour?: string;
}

function EventRow(props: PropsWithChildren<EventRowProps>) {
  const { children, eventIndex, isPast, selectedRef, skip, colour } = props;
  const ownRef = useRef<HTMLTableRowElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const textColour = getAccessibleColour(colour);
  const bgColour = textColour.backgroundColor;

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

  return (
    <tr
      className={`${style.eventRow} ${skip ? style.skip : ''}`}
      style={{ opacity: `${isPast ? pastOpacity : '1'}` }}
      ref={selectedRef ?? ownRef}
    >
      <td className={style.indexColumn} style={{ backgroundColor: bgColour, color: textColour.color }}>
        {eventIndex}
      </td>
      {isVisible ? children : null}
    </tr>
  );
}

export default memo(EventRow);
