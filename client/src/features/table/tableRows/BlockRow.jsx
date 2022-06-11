import React from 'react';
import PropTypes from 'prop-types';

import style from '../Table.module.scss';

export default function BlockRow(props) {
  const { row } = props;
  return (
    <tr {...row.getRowProps()}>
      <td className={style.blockCell}>Delay Block</td>
    </tr>
  );
}

BlockRow.propTypes = {
  row: PropTypes.object.isRequired,
};
