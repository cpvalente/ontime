import { Toolbar } from '@base-ui/react/toolbar';
import type { Column } from '@tanstack/react-table';

import type { ExtendedEntry } from '../../../common/utils/rundownMetadata';
import {
  ColumnSettings,
  ViewSettings,
} from '../../../views/cuesheet/cuesheet-table/cuesheet-table-settings/CuesheetTableSettings';
import { usePersistedRundownOptions } from '../rundown.options';

import style from '../../../views/cuesheet/cuesheet-table/cuesheet-table-settings/CuesheetTableSettings.module.scss';

interface EditorTableSettingsProps {
  columns: Column<ExtendedEntry, unknown>[];
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
}

export default function EditorTableSettings({
  columns,
  handleResetResizing,
  handleResetReordering,
  handleClearToggles,
}: EditorTableSettingsProps) {
  const options = usePersistedRundownOptions();

  return (
    <Toolbar.Root className={style.tableSettings}>
      <ViewSettings optionsStore={options} />
      <ColumnSettings
        columns={columns}
        handleResetResizing={handleResetResizing}
        handleResetReordering={handleResetReordering}
        handleClearToggles={handleClearToggles}
      />
    </Toolbar.Root>
  );
}
