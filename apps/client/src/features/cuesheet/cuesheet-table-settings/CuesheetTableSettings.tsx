import { Button, Checkbox, Switch } from '@chakra-ui/react';
import { Column } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

import { useCuesheetSettings } from '../store/CuesheetSettings';

import style from './CuesheetTableSettings.module.scss';

// reusable button styles
const buttonProps = {
  size: 'sm',
  variant: 'ontime-subtle',
};

interface CuesheetTableSettingsProps {
  columns: Column<OntimeRundownEntry, unknown>[];
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
}

export default function CuesheetTableSettings(props: CuesheetTableSettingsProps) {
  const { columns, handleResetResizing, handleResetReordering, handleClearToggles } = props;
  const showPrevious = useCuesheetSettings((state) => state.showPrevious);
  const togglePreviousVisibility = useCuesheetSettings((state) => state.togglePreviousVisibility);
  const showDelayBlock = useCuesheetSettings((state) => state.showDelayBlock);
  const toggleDelayVisibility = useCuesheetSettings((state) => state.toggleDelayVisibility);
  const showDelayedTimes = useCuesheetSettings((state) => state.showDelayedTimes);
  const toggleDelayedTimes = useCuesheetSettings((state) => state.toggleDelayedTimes);

  return (
    <div className={style.tableSettings}>
      <div className={style.leftPanel}>
        <div className={style.sectionTitle}>Toggle column visibility</div>
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
        <div className={style.options}>
          <label className={style.option}>
            <Switch variant='ontime' size='sm' isChecked={showPrevious} onChange={() => togglePreviousVisibility()} />
            Show past events
          </label>
        </div>
        <div className={style.sectionTitle}>Delay Flow</div>
        <div className={style.options}>
          <label className={style.option}>
            <Switch variant='ontime' size='sm' isChecked={showDelayedTimes} onChange={() => toggleDelayedTimes()} />
            Show delayed times
          </label>
          <label className={style.option}>
            <Switch variant='ontime' size='sm' isChecked={showDelayBlock} onChange={() => toggleDelayVisibility()} />
            Show delay blocks
          </label>
        </div>
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
