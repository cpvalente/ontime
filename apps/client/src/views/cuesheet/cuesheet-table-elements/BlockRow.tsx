import { memo } from 'react';

import style from '../Cuesheet.module.scss';

interface BlockRowProps {
  title: string;
}

function BlockRow(props: BlockRowProps) {
  const { title } = props;
  return (
    <tr className={style.blockRow}>
      <td>{title}</td>
    </tr>
  );
}

export default memo(BlockRow);
