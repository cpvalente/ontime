import type { CustomField, CustomFieldKey, SpreadsheetPreviewResponse } from 'ontime-types';
import { isOntimeEvent, isOntimeGroup, isOntimeMilestone } from 'ontime-types';
import { useMemo } from 'react';

import { getCellValue } from './previewTableUtils';

import style from './PreviewTable.module.scss';

interface PreviewTableProps {
  preview: SpreadsheetPreviewResponse | null;
  columnLabels: string[];
  isLoadingMetadata: boolean;
  worksheetHeaders: string[];
}

export default function PreviewTable({
  preview,
  columnLabels,
  isLoadingMetadata,
  worksheetHeaders,
}: PreviewTableProps) {
  const customFieldKeyByLabel = useMemo(() => {
    if (!preview) return new Map<CustomField['label'], CustomFieldKey>();
    return new Map(Object.entries(preview.customFields).map(([fieldId, field]) => [field.label, fieldId]));
  }, [preview]);

  if (!preview) {
    let emptyContent = 'Select the fields you want to import, then click Preview import.';

    if (isLoadingMetadata) {
      emptyContent = 'Loading worksheet metadata...';
    } else if (worksheetHeaders.length === 0) {
      emptyContent =
        'No column headers detected in this worksheet. Try a different worksheet or ensure the first row contains column headers.';
    }

    return (
      <div className={style.emptyState}>
        <div className={style.emptyTitle}>Preview not generated</div>
        <div className={style.emptyBody}>{emptyContent}</div>
      </div>
    );
  }

  let eventIndex = 0;

  return (
    <table className={style.table}>
      <thead>
        <tr>
          <th className={style.rowNumber}>#</th>
          <th className={style.rowType}>Type</th>
          {columnLabels.map((label, index) => (
            <th key={`${label}-${index}`}>{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {preview.rundown.flatOrder.map((entryId) => {
          const entry = preview.rundown.entries[entryId];
          const isEvent = isOntimeEvent(entry);
          if (isEvent) eventIndex++;
          const hasType = isEvent || isOntimeGroup(entry) || isOntimeMilestone(entry);

          return (
            <tr key={entryId}>
              <td className={style.rowNumber}>{isEvent ? eventIndex : ''}</td>
              <td className={style.rowType}>{hasType ? entry.type : ''}</td>
              {columnLabels.map((label, colIndex) => (
                <td key={`${entryId}-${colIndex}`}>{getCellValue(label, entry, customFieldKeyByLabel)}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
