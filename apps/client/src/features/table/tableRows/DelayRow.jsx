import PropTypes from 'prop-types';

import { millisToDelayString } from '../../../common/utils/dateConfig';

import style from '../Table.module.scss';

export default function DelayRow(props) {
  const { row } = props;
  const delayVal = row.original.duration;
  const delayTime = delayVal !== 0 ? millisToDelayString(delayVal) : null;

  return (
    <tr {...row.getRowProps()}>
      <td className={style.delayCell}>{delayTime}</td>
    </tr>
  );
}

DelayRow.propTypes = {
  row: PropTypes.object.isRequired,
};
