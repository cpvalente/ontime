import type { EntryId } from 'ontime-types';
import { useMemo } from 'react';

import { cx, enDash } from '../../../../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../../../../common/utils/time';
import * as Panel from '../../../panel-utils/PanelUtils';
import { formatOffset, offsetTone } from '../reportSettings.utils';
import type { CombinedReport, GroupReport } from '../reportSettings.utils';

import style from './ReportTable.module.scss';

interface ReportTableProps {
  rows: CombinedReport[];
  groups: GroupReport[];
}

type ReportColourStyle = React.CSSProperties & Partial<Record<'--event-bg' | '--user-bg', string | undefined>>;

/**
 * The report laid out the way the show was planned: blocks, then the events
 * inside them. Each block carries how it ran against the budget set for it.
 */
export default function ReportTable({ rows, groups }: ReportTableProps) {
  // groups are rendered where their first event appears, so the table follows
  // the rundown rather than a separate ordering
  const sections = useMemo(() => makeSections(rows, groups), [rows, groups]);

  return (
    <Panel.Table>
      <thead>
        <tr>
          <th>#</th>
          <th>Cue</th>
          <th>Title</th>
          <th>Scheduled Start</th>
          <th>Actual Start</th>
          <th>Scheduled End</th>
          <th>Actual End</th>
        </tr>
      </thead>
      {sections.map((section, index) => (
        <tbody key={section.key}>
          {section.group && index > 0 && <GroupSpacer />}
          {section.group && <GroupRow group={section.group} />}
          {section.rows.map((entry) => (
            <EventRow
              key={entry.id}
              entry={entry}
              groupColour={section.group?.colour}
              grouped={section.group !== null}
            />
          ))}
        </tbody>
      ))}
    </Panel.Table>
  );
}

function GroupSpacer() {
  return (
    <tr aria-hidden='true' className={style.groupSpacer}>
      <td colSpan={7} />
    </tr>
  );
}

/**
 * A group read the same way as the show above it: what it was measured
 * against, what it actually did, and how much of it ran.
 */
function GroupRow({ group }: { group: GroupReport }) {
  const hasTarget = group.targetDuration !== null;
  const measuredAgainst = group.targetDuration ?? group.scheduledDuration;
  const unavailableReason = group.eventsRun === 0 ? 'Did not run' : 'Still running';

  return (
    <tr className={style.groupRow} style={groupColourStyle(group.colour)}>
      <th scope='rowgroup' colSpan={7} className={style.groupSummary}>
        <span className={style.groupTitle}>{group.title || 'Untitled group'}</span>
        <div className={style.groupBody}>
          <div className={style.groupHeadline}>
            <span className={style.groupLabel}>{hasTarget ? 'Against target' : 'Against schedule'}</span>
            {group.variance === null ? (
              <span className={style.unavailable}>{unavailableReason}</span>
            ) : (
              <span className={cx([style.groupHeadlineValue, style[offsetTone(group.variance)]])}>
                {formatOffset(group.variance)}
              </span>
            )}
          </div>
          <dl className={style.groupMetrics}>
            <dt>{hasTarget ? 'Target' : 'Scheduled'}</dt>
            <dd className={style.groupValues}>
              <span>{formatDuration(measuredAgainst, false)}</span>
              <span className={style.arrow}>→</span>
              <b>{group.elapsed === null ? enDash : formatDuration(group.elapsed, false)}</b>
            </dd>
            {group.actualStart !== null && group.actualEnd !== null && (
              <>
                <dt>Ran</dt>
                <dd className={style.groupValues}>
                  <span>{formatTime(group.actualStart)}</span>
                  <span className={style.arrow}>→</span>
                  <b>{formatTime(group.actualEnd)}</b>
                </dd>
              </>
            )}
          </dl>
        </div>
      </th>
    </tr>
  );
}

function EventRow({ entry, groupColour, grouped }: { entry: CombinedReport; groupColour?: string; grouped: boolean }) {
  const start = offsetTone(entry.startOffset);
  const end = offsetTone(entry.endOffset);

  return (
    <tr className={cx([style.eventRow, grouped && style.groupedRow])} style={eventColours(entry.colour, groupColour)}>
      <td className={style.eventIndex}>{entry.index}</td>
      <td className={style.eventCue}>{entry.cue}</td>
      <td>{entry.title}</td>
      <td>{formatTime(entry.scheduledStart)}</td>
      <td className={cx([style[start]])}>{formatTime(entry.actualStart)}</td>
      <td>{formatTime(entry.scheduledEnd)}</td>
      <td className={cx([style[end]])}>{formatTime(entry.actualEnd)}</td>
    </tr>
  );
}

/**
 * Uses the cuesheet's custom property for group colour. Left unset when the
 * group has none so the stylesheet can provide a neutral edge.
 */
function groupColourStyle(colour?: string): ReportColourStyle {
  const style: ReportColourStyle = {};
  if (colour) style['--user-bg'] = colour;
  return style;
}

/** Keeps the event wash distinct from its parent group's identifying rail. */
function eventColours(eventColour: string, groupColour?: string): ReportColourStyle {
  const style: ReportColourStyle = {};
  if (eventColour) style['--event-bg'] = eventColour;
  if (groupColour) style['--user-bg'] = groupColour;
  return style;
}

type Section = {
  key: string;
  group: GroupReport | null;
  rows: CombinedReport[];
};

/**
 * Splits the rows into the blocks they belong to, keeping rundown order and
 * leaving ungrouped events in their own run of rows.
 */
function makeSections(rows: CombinedReport[], groups: GroupReport[]): Section[] {
  const byId = new Map<EntryId, GroupReport>(groups.map((group) => [group.id, group]));
  const sections: Section[] = [];
  let current: Section | null = null;

  let currentParent: EntryId | null | undefined;

  for (const row of rows) {
    if (current === null || row.parent !== currentParent) {
      currentParent = row.parent;
      // index keeps the key unique even if a group were to appear twice
      current = {
        key: `${row.parent ?? 'ungrouped'}-${sections.length}`,
        group: row.parent ? (byId.get(row.parent) ?? null) : null,
        rows: [],
      };
      sections.push(current);
    }
    current.rows.push(row);
  }

  return sections;
}
