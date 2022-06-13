import React from 'react';
import { Button } from '@chakra-ui/button';
import PropTypes from 'prop-types';

import style from '../Table.module.scss';

// reusable button styles
const buttonProps = {
  colorScheme: 'blue',
  size: 'sm',
  variant: 'ghost',
};

export default function TableSettings(props) {
  const {
    columns,
    handleResetResizing,
    handleResetReordering,
    handleResetToggles,
    handleClearToggles,
  } = props;

  return (
    <div className={style.tableSettings}>
      <div className={style.hSeparator}>Select and order fields to show in table</div>
      <div className={style.options}>
        {columns.map((column) => (
          <label key={column.id}>
            <input type='checkbox' {...column.getToggleHiddenProps()} /> {column.Header}
          </label>
        ))}
      </div>
      <div className={style.buttonRow}>
        <Button onClick={handleResetResizing} {...buttonProps}>
          Reset Resizing
        </Button>
        <Button onClick={handleResetReordering} {...buttonProps}>
          Reset Reordering
        </Button>
        <Button onClick={handleResetToggles} {...buttonProps}>
          Reset Toggles
        </Button>
        <Button onClick={handleClearToggles} {...buttonProps}>
          Show All
        </Button>
      </div>
    </div>
  );
}

TableSettings.propTypes = {
  columns: PropTypes.array,
  handleResetResizing: PropTypes.func.isRequired,
  handleResetReordering: PropTypes.func.isRequired,
  handleResetToggles: PropTypes.func.isRequired,
  handleClearToggles: PropTypes.func.isRequired,
};
