import { Button } from '@chakra-ui/react';

import style from '../Table.module.scss';

// reusable button styles
const buttonProps = {
  colorScheme: 'blue',
  size: 'sm',
  variant: 'ontime-filled',
};

interface TableSettingsProps {
  columns: any;
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleResetToggles: () => void;
  handleClearToggles: () => void;
}

export default function TableSettings(props: TableSettingsProps) {
  const { columns, handleResetResizing, handleResetReordering, handleResetToggles, handleClearToggles } = props;

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

interface CuesheetSettingsProps {
  columns: any;
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
}

export function CuesheetSettings(props: CuesheetSettingsProps) {
  const { columns, handleResetResizing, handleResetReordering, handleClearToggles } = props;

  return (
    <div className={style.tableSettings}>
      <div className={style.hSeparator}>Select and order fields to show in cuesheet</div>
      <div className={style.options}>
        {columns.map((column) => {
          const columnHeader = column.columnDef.header;
          const visible = column.getIsVisible();

          return (
            <label key={column.id}>
              <input type='checkbox' checked={visible} onChange={column.getToggleVisibilityHandler()} /> {columnHeader}
            </label>
          );
        })}
      </div>
      <div className={style.buttonRow}>
        <Button onClick={handleResetResizing} {...buttonProps}>
          Reset Resizing
        </Button>
        <Button onClick={handleResetReordering} {...buttonProps}>
          Reset Reordering
        </Button>
        <Button onClick={handleClearToggles} {...buttonProps}>
          Show All
        </Button>
      </div>
    </div>
  );
}
