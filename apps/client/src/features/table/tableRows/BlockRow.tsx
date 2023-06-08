import style from '../Table.module.scss';

interface BlockRowProps {
  row: any;
}
export default function BlockRow(props: BlockRowProps) {
  const { row } = props;
  return (
    <tr {...row.getRowProps()}>
      <td className={style.blockCell}>{row.original?.title || 'Block'}</td>
    </tr>
  );
}
