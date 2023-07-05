import { useContext } from 'react';
import { Button, Checkbox, Switch } from '@chakra-ui/react';
import { Column } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

import { TableSettingsContext } from '../../../common/context/TableSettingsContext';

import style from './TableSettings.module.scss';

// reusable button styles
const buttonProps = {
  size: 'sm',
  variant: 'ontime-subtle',
};

interface CuesheetSettingsProps {
  columns: Column<OntimeRundownEntry, unknown>[];
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
}

export function CuesheetSettings(props: CuesheetSettingsProps) {
  const { columns, handleResetResizing, handleResetReordering, handleClearToggles } = props;
  const { showDelayBlock, toggleDelayVisibility } = useContext(TableSettingsContext);

  return (
    <div className={style.tableSettings}>
      <div className={style.leftPanel}>
        <div className={style.sectionTitle}>Toggle field visibility</div>
        <div className={style.options}>
          {columns.map((column) => {
            const columnHeader = column.columnDef.header;
            const visible = column.getIsVisible();

            return (
              <label key={`${column.id}-${visible}`} className={style.option}>
                <Checkbox
                  variant='ontime-ondark'
                  defaultChecked={visible}
                  onChange={column.getToggleVisibilityHandler()}
                />
                {columnHeader}
              </label>
            );
          })}
        </div>
        <div className={style.sectionTitle}>Table Options</div>
        <label className={style.option}>
          <Switch variant='ontime' size='sm' isChecked={showDelayBlock} onChange={toggleDelayVisibility} />
          Show delay blocks
        </label>
        <label className={style.option}>
          <Switch variant='ontime' size='sm' isChecked={false} onChange={() => undefined} />
          Hide past events
        </label>
      </div>
      <div className={style.rightPanel}>
        <Button onClick={handleClearToggles} {...buttonProps}>
          Show All
        </Button>
        <Button onClick={handleResetResizing} {...buttonProps}>
          Reset Resizing
        </Button>
        <Button onClick={handleResetReordering} {...buttonProps}>
          Reset Reordering
        </Button>
      </div>
    </div>
  );
}
