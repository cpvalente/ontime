import { memo, ReactNode } from 'react';
import { Column } from '@tanstack/react-table';
import { OntimeEntry } from 'ontime-types';

import Button from '../../../../common/components/buttons/Button';
import Checkbox from '../../../../common/components/checkbox/Checkbox';
import * as Editor from '../../../../common/components/editor-utils/EditorUtils';

import style from './CuesheetTableSettings.module.scss';

interface CuesheetTableSettingsProps {
  columns: Column<OntimeEntry, unknown>[];
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
}

function CuesheetTableSettings({
  columns,
  handleResetResizing,
  handleResetReordering,
  handleClearToggles,
}: CuesheetTableSettingsProps) {
  return (
    <div className={style.tableSettings}>
      <div>
        <Editor.Label className={style.sectionTitle}>Toggle column visibility</Editor.Label>
        <div className={style.row}>
          {columns.map((column) => {
            const columnHeader = column.columnDef.header;
            const visible = column.getIsVisible();
            return (
              <Editor.Label key={`${column.id}-${visible}`} className={style.option}>
                <Checkbox defaultChecked={visible} onCheckedChange={column.toggleVisibility} />
                {columnHeader as ReactNode}
              </Editor.Label>
            );
          })}
        </div>
      </div>
      <div className={style.column}>
        <Editor.Label className={style.sectionTitle}>Reset Options</Editor.Label>
        <div className={style.row}>
          <Button size='small' variant='subtle' onClick={handleClearToggles}>
            Show All
          </Button>
          <Button size='small' variant='subtle' onClick={handleResetResizing}>
            Reset Resizing
          </Button>
          <Button size='small' variant='subtle' onClick={handleResetReordering}>
            Reset Reordering
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(CuesheetTableSettings);
