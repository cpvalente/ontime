import { memo, ReactNode } from 'react';
import { Button, Checkbox } from '@chakra-ui/react';
import { Column } from '@tanstack/react-table';
import { OntimeEntry } from 'ontime-types';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';

import style from './CuesheetTableSettings.module.scss';

// reusable button styles
const buttonProps = {
  size: 'xs',
  variant: 'ontime-subtle',
};

interface CuesheetTableSettingsProps {
  columns: Column<OntimeEntry, unknown>[];
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
}

function CuesheetTableSettings(props: CuesheetTableSettingsProps) {
  const { columns, handleResetResizing, handleResetReordering, handleClearToggles } = props;

  return (
    <div className={style.tableSettings}>
      <div>
        <Editor.Label className={style.sectionTitle}>Toggle column visibility</Editor.Label>
        <div className={style.row}>
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
                {columnHeader as ReactNode}
              </label>
            );
          })}
        </div>
      </div>
      <div className={style.column}>
        <Editor.Label className={style.sectionTitle}>Reset Options</Editor.Label>
        <div className={style.row}>
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
    </div>
  );
}

export default memo(CuesheetTableSettings);
