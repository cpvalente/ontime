import { memo, MutableRefObject, PropsWithChildren } from 'react';

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

  const bgFallback = 'transparent';
  const bgColour = colour || bgFallback;
  const textColour = bgColour === bgFallback ? undefined : getAccessibleColour(bgColour);

  return (
    <tr
      className={`${style.eventRow} ${skip ? style.skip : ''}`}
      style={{ opacity: `${isPast ? pastOpacity : '1'}` }}
      ref={selectedRef}
    >
      <td className={style.indexColumn} style={{ backgroundColor: bgColour, color: textColour?.color }}>
        {eventIndex}
      </td>
      {children}
    </tr>
  );
}

export default memo(EventRow);
