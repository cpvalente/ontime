import type { CustomField, CustomFieldKey, SpreadsheetPreviewResponse } from 'ontime-types';
import { isOntimeDelay, isOntimeEvent, isOntimeGroup, isOntimeMilestone } from 'ontime-types';
import type { CSSProperties } from 'react';
import { useMemo } from 'react';

import Button from '../../../../../../../common/components/buttons/Button';
import Tag from '../../../../../../../common/components/tag/Tag';
import { getRundownMetadata } from '../../../../../../../common/utils/rundownMetadata';
import * as Panel from '../../../../../panel-utils/PanelUtils';
import { getCellValue } from './previewTableUtils';

import style from './PreviewTable.module.scss';

interface PreviewTableProps {
  preview: SpreadsheetPreviewResponse | null;
  columnLabels: string[];
  canRefresh: boolean;
  isLoadingMetadata: boolean;
  isRefreshing: boolean;
  needsPreviewRefresh: boolean;
  onRefresh: () => void;
  worksheetHeaders: string[];
}

const priorityColumns = ['Title', 'Cue', 'Start', 'End', 'Duration'];
const numericColumns = new Set(['Start', 'End', 'Duration', 'Time warning', 'Time danger']);
const transparentColour = 'transparent';

type PreviewEntry = SpreadsheetPreviewResponse['rundown']['entries'][string];

function getEntryDisplay(entry: PreviewEntry, groupColour?: string) {
  if (isOntimeGroup(entry)) {
    return {
      rowClassName: style.groupRow,
      entryColour: entry.colour,
      entryType: 'Group',
    };
  }

  const entryColour = groupColour ?? transparentColour;

  if (isOntimeMilestone(entry)) {
    return {
      rowClassName: style.milestoneRow,
      entryColour,
      entryType: 'Milestone',
    };
  }

  if (isOntimeDelay(entry)) {
    return {
      rowClassName: style.eventRow,
      entryColour,
      entryType: 'Delay',
    };
  }

  return {
    rowClassName: style.eventRow,
    entryColour,
    entryType: 'Event',
  };
}

function getCellClassName(label: string, value: string) {
  if (value.includes('\n')) {
    return style.multilineCell;
  }

  if (numericColumns.has(label)) {
    return style.numericCell;
  }

  return undefined;
}

function getDisplayColumns(columnLabels: string[]) {
  return [...columnLabels].sort((left, right) => {
    const leftPriority = priorityColumns.indexOf(left);
    const rightPriority = priorityColumns.indexOf(right);
    return (
      (leftPriority === -1 ? priorityColumns.length : leftPriority) -
      (rightPriority === -1 ? priorityColumns.length : rightPriority)
    );
  });
}

export default function PreviewTable({
  preview,
  columnLabels,
  canRefresh,
  isLoadingMetadata,
  isRefreshing,
  needsPreviewRefresh,
  onRefresh,
  worksheetHeaders,
}: PreviewTableProps) {
  const customFieldKeyByLabel = useMemo(() => {
    if (!preview) return new Map<CustomField['label'], CustomFieldKey>();
    return new Map(Object.entries(preview.customFields).map(([fieldId, field]) => [field.label, fieldId]));
  }, [preview]);

  const displayColumns = useMemo(() => getDisplayColumns(columnLabels), [columnLabels]);

  const previewMetadata = useMemo(() => {
    if (!preview) return null;
    return getRundownMetadata(preview.rundown, null);
  }, [preview]);

  if (!preview) {
    let emptyTitle = 'Preview not generated';
    let emptyContent = 'Select the fields you want to import, then click Preview import.';

    if (isLoadingMetadata) {
      emptyTitle = 'Loading worksheet';
      emptyContent = 'Loading worksheet metadata...';
    } else if (worksheetHeaders.length === 0) {
      emptyTitle = 'No headers found';
      emptyContent =
        'No column headers detected in this worksheet. Try a different worksheet or ensure the first row contains column headers.';
    } else if (needsPreviewRefresh) {
      emptyTitle = 'Preview needs updating';
      emptyContent = 'Your column mapping changed. Preview the import again to update this table.';
    }

    return (
      <Panel.EmptyState
        title={emptyTitle}
        description={emptyContent}
        action={
          needsPreviewRefresh && (
            <Button variant='primary' onClick={onRefresh} disabled={!canRefresh} loading={isRefreshing}>
              Refresh preview
            </Button>
          )
        }
      />
    );
  }

  return (
    <table className={style.table}>
      <thead>
        <tr>
          <th className={style.rowNumber}>#</th>
          <th className={style.rowType}>Type</th>
          {displayColumns.map((label, index) => (
            <th key={`${label}-${index}`}>{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {preview.rundown.flatOrder.map((entryId) => {
          const entry = preview.rundown.entries[entryId];
          const isEvent = isOntimeEvent(entry);
          const entryMetadata = previewMetadata?.[entryId];
          const { rowClassName, entryColour, entryType } = getEntryDisplay(entry, entryMetadata?.groupColour);

          return (
            <tr key={entryId} className={rowClassName} style={{ '--entry-colour': entryColour } as CSSProperties}>
              <td className={style.rowNumber}>{isEvent ? entryMetadata?.eventIndex : ''}</td>
              <td className={style.rowType}>
                <Tag>{entryType}</Tag>
              </td>
              {displayColumns.map((label, colIndex) => {
                const value = getCellValue(label, entry, customFieldKeyByLabel);
                const cellClassName = getCellClassName(label, value);
                return (
                  <td
                    key={`${entryId}-${colIndex}`}
                    className={cellClassName}
                    data-empty={value === ''}
                    title={value || undefined}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
