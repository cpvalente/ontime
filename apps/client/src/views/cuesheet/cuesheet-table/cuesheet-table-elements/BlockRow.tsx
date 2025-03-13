import { memo, useRef } from 'react';

import { useCurrentBlockId } from '../../../../common/hooks/useSocket';

import style from '../CuesheetTable.module.scss';

interface BlockRowProps {
  hidePast: boolean;
  title: string;
  columnCount: number;
}

function BlockRow(props: BlockRowProps) {
  const { hidePast, title, columnCount } = props;
  const { currentBlockId } = useCurrentBlockId();
  const firstCellRef = useRef<null | HTMLTableCellElement>(null);

  if (hidePast && !currentBlockId) {
    return null;
  }

  const paddingRows = new Array(columnCount - 1).fill(null);

  return (
    <tr className={style.blockRow}>
      <td tabIndex={-1} role='cell' ref={firstCellRef}>
        {title}
      </td>
      {paddingRows.map((_value, index) => {
        return (
          <td
            key={index}
            tabIndex={-1}
            role='cell'
            onFocus={() => {
              firstCellRef.current?.focus();
            }}
          />
        );
      })}
    </tr>
  );
}

export default memo(BlockRow);
