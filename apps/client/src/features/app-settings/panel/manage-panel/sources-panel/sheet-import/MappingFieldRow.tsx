import type { ReactNode } from 'react';
import { IoCheckmark } from 'react-icons/io5';

import AutocompleteInput from '../../../../../../common/components/autocomplete-input/AutocompleteInput';
import { cx } from '../../../../../../common/utils/styleUtils';
import type { MappingWarning } from './importMapUtils';

import style from './SheetImportEditor.module.scss';

export function getWarningText(warning: MappingWarning): string {
  switch (warning.kind) {
    case 'duplicate':
      return 'Column mapped more than once';
    case 'missing':
      return 'Column not in current headers, check preview';
    case 'invalid-name':
      return 'Column cannot be converted into an Ontime field name';
    case 'name-collision':
      return 'Column name resolves to a duplicate column';
    default:
      return '';
  }
}

interface MappingFieldRowProps {
  header: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  warning?: MappingWarning;
  options: string[];
  assigned: Set<string>;
  disabled?: boolean;
}

export default function MappingFieldRow({
  header,
  value,
  onValueChange,
  warning,
  options,
  assigned,
  disabled = false,
}: MappingFieldRowProps) {
  const warningText = warning ? getWarningText(warning) : undefined;

  return (
    <div className={style.mappingField}>
      {header}
      {warningText && <span className={style.mappingFieldWarning}>{warningText}</span>}
      <AutocompleteInput
        className={cx([style.columnInput, warning && style.columnInputWarn])}
        maxLength={50}
        options={options}
        openOnFocus
        trailingElement={(option) => (assigned.has(option) ? <IoCheckmark /> : null)}
        placeholder='Spreadsheet column'
        disabled={disabled}
        title={warningText}
        value={value}
        onValueChange={onValueChange}
      />
    </div>
  );
}
