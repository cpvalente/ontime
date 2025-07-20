import EmptyImage from '../../../assets/images/empty.svg?react';

import style from './EmptyTableBody.module.scss';

interface EmptyTableBodyProps {
  text: string;
}

export default function EmptyTableBody({ text }: EmptyTableBodyProps) {
  return (
    <tbody className={style.emptyContainer}>
      <tr>
        <td colSpan={99} className={style.emptyCell}>
          <EmptyImage className={style.empty} />
          {text && <span className={style.text}>{text}</span>}
        </td>
      </tr>
    </tbody>
  );
}
