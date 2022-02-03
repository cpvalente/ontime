import style from './Table.module.scss';
import { Checkbox } from '@chakra-ui/react';
import PropTypes from 'prop-types';

export default function TableFilter({ dark, columns, handleHide }) {
  return (
    <div className={style.tableSettings}>
      {columns
        .filter((c) => c.filterable)
        .map((c) => (
          <Checkbox
            key={c.accessor}
            isChecked={c.visible}
            onChange={() => handleHide(c.accessor)}
            iconColor=  {dark ? 'unset' : 'blue.800' }
          >
            {c.header}
          </Checkbox>
        ))}
    </div>
  );
}

TableFilter.propTypes = {
  columns: PropTypes.object.isRequired,
  handleHide: PropTypes.func.isRequired,
  dark: PropTypes.bool
}
