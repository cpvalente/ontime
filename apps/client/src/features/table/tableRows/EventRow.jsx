import PropTypes from 'prop-types';

import { getAccessibleColour } from '../../../common/utils/styleUtils';

import style from '../Table.module.scss';

export default function EventRow(props) {
  const { row, index, selectedId, delay } = props;
  const selected = row.original.id === selectedId;

  const colours = row.original.colour
    ? getAccessibleColour(row.original.colour)
    : {};

  return (
    <tr {...row.getRowProps()} className={selected ? style.selected : ''} id={row.original.id}>
      <td className={style.indexColumn}>{index}</td>
      {row.cells.map((cell) => {
        const { key, style, ...restCellProps } = cell.getCellProps();
        const dynamicStyles = { ...style, ...colours };


        // Inject delay value if exits
        if (delay !== 0 && delay != null) {
          const col = cell.column.Header;
          if (col === 'End' || col === 'Start') {
            cell.delayed = cell.value + delay;
          }
        }

        return (
          <td key={key} style={{ ...dynamicStyles }} {...restCellProps}>
            {cell.render('Cell')}
          </td>
        );
      })}
    </tr>
  );
}

EventRow.propTypes = {
  row: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  selectedId: PropTypes.string,
  delay: PropTypes.number,
};
