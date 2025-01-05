import { memo, ReactNode } from 'react';
import { Column } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import * as Editor from '../../../features/editors/editor-utils/EditorUtils';

import style from './CuesheetTableSettings.module.scss';

interface CuesheetTableSettingsProps {
  columns: Column<OntimeRundownEntry, unknown>[];
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
                <Checkbox defaultChecked={visible} onChange={column.getToggleVisibilityHandler()} />
                {columnHeader as ReactNode}
              </label>
            );
          })}
        </div>
      </div>
      <div className={style.column}>
        <Editor.Label className={style.sectionTitle}>Reset Options</Editor.Label>
        <div className={style.row}>
          <Button onClick={handleClearToggles} size='sm' variant='ontime-subtle'>
            Show All
          </Button>
          <Button onClick={handleResetResizing} size='sm' variant='ontime-subtle'>
            Reset Resizing
          </Button>
          <Button onClick={handleResetReordering} size='sm' variant='ontime-subtle'>
            Reset Reordering
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(CuesheetTableSettings);
