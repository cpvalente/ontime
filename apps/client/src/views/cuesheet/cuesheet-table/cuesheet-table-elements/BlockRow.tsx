import { memo } from 'react';

import { useCurrentBlockId } from '../../../../common/hooks/useSocket';

import style from '../CuesheetTable.module.scss';

interface BlockRowProps {
  hidePast: boolean;
  title: string;
}

function BlockRow(props: BlockRowProps) {
  const { hidePast, title } = props;
  const { currentBlockId } = useCurrentBlockId();

  if (hidePast && !currentBlockId) {
    return null;
  }

  return (
    <tr className={style.blockRow}>
      <td>{title}</td>
    </tr>
  );
}

export default memo(BlockRow);
