import { Fragment } from 'react';
import { IoLink } from 'react-icons/io5';
import { CustomFields, isOntimeEvent, isOntimeGroup, isOntimeMilestone, Rundown } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import Tag from '../../../../../../common/components/tag/Tag';
import { getAccessibleColour } from '../../../../../../common/utils/styleUtils';
import * as Panel from '../../../../panel-utils/PanelUtils';

import style from './PreviewRundown.module.scss';

interface PreviewRundownProps {
  rundown: Rundown;
  customFields: CustomFields;
}

function booleanToText(value?: boolean) {
  return value ? 'Yes' : undefined;
}

export default function PreviewRundown(props: PreviewRundownProps) {
  const { rundown, customFields } = props;

  // we only count Ontime Events which are 1 based in client
  let eventIndex = 0;

  const fieldKeys = Object.keys(customFields);
  const fieldLabels = fieldKeys.map((key) => customFields[key].label);

  return (
    <Panel.Table className={style.nowrap}>
      <thead>
        <tr>
          <th>#</th>
          <th>Type</th>
          <th>Cue</th>
          <th>Title</th>
          <th>Flag</th>
          <th>Time Start</th>
          <th>Time End</th>
          <th>Duration</th>
          <th>Warning Time</th>
          <th>Danger Time</th>
          <th>Count to end</th>
          <th>Skip</th>
          <th>Colour</th>
          <th>Timer Type</th>
          <th>End Action</th>
          {fieldLabels.map((label) => (
            <th key={label}>{label}</th>
          ))}
          <th>ID</th>
        </tr>
      </thead>
      <tbody>
        {rundown.order.map((entryId) => {
          const entry = rundown.entries[entryId];
          if (isOntimeGroup(entry)) {
            return (
              <tr key={entry.id}>
                <td className={style.center}>
                  <Tag>-</Tag>
                </td>
                <td className={style.center}>
                  <Tag>{entry.type}</Tag>
                </td>
                <td />
                <td colSpan={99}>{entry.title}</td>
              </tr>
            );
          }
          if (isOntimeMilestone(entry)) {
            const colour = entry.colour ? getAccessibleColour(entry.colour) : {};
            return (
              <Fragment key={entry.id}>
                <tr>
                  <td className={style.center} />
                  <td className={style.center}>
                    <Tag>{entry.type}</Tag>
                  </td>
                  <td className={style.nowrap}>{entry.cue}</td>
                  <td>{entry.title}</td>
                  <td className={style.center} />
                  <td className={style.flex} />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td style={{ ...colour }}>{entry.colour}</td>
                  <td className={style.center} />
                  <td className={style.center} />
                  {isOntimeMilestone(entry) &&
                    fieldKeys.map((field) => {
                      let value = '';
                      if (field in entry.custom) {
                        value = entry.custom[field];
                      }
                      return <td key={field}>{value}</td>;
                    })}
                  <td className={style.center}>
                    <Tag>{entry.id}</Tag>
                  </td>
                </tr>
                {entry.note && (
                  <tr>
                    <td colSpan={99} className={style.secondaryRow}>
                      Note: {entry.note}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          }
          if (!isOntimeEvent(entry)) {
            return null;
          }
          eventIndex += 1;
          const colour = entry.colour ? getAccessibleColour(entry.colour) : {};
          const countToEnd = booleanToText(entry.countToEnd);
          const skip = booleanToText(entry.skip);
          const flag = booleanToText(entry.flag);

          return (
            <Fragment key={entry.id}>
              <tr>
                <td className={style.center}>
                  <Tag>{eventIndex}</Tag>
                </td>
                <td className={style.center}>
                  <Tag>{entry.type}</Tag>
                </td>
                <td className={style.nowrap}>{entry.cue}</td>
                <td>{entry.title}</td>
                <td className={style.center}>{flag && <Tag>{flag}</Tag>}</td>
                <td className={style.flex}>
                  <span className={entry.linkStart ? style.subdued : undefined}>{millisToString(entry.timeStart)}</span>
                  {entry.linkStart && <IoLink className={style.linkStartActive} />}
                </td>
                <td>{millisToString(entry.timeEnd)}</td>
                <td>{millisToString(entry.duration)}</td>
                <td>{millisToString(entry.timeWarning)}</td>
                <td>{millisToString(entry.timeDanger)}</td>
                <td className={style.center}>{countToEnd && <Tag>{countToEnd}</Tag>}</td>
                <td>{skip && <Tag>{skip}</Tag>}</td>
                <td style={{ ...colour }}>{entry.colour}</td>
                <td className={style.center}>
                  <Tag>{entry.timerType}</Tag>
                </td>
                <td className={style.center}>
                  <Tag>{entry.endAction}</Tag>
                </td>
                {isOntimeEvent(entry) &&
                  fieldKeys.map((field) => {
                    let value = '';
                    if (field in entry.custom) {
                      value = entry.custom[field];
                    }
                    return <td key={field}>{value}</td>;
                  })}
                <td className={style.center}>
                  <Tag>{entry.id}</Tag>
                </td>
              </tr>
              {entry.note && (
                <tr>
                  <td colSpan={99} className={style.secondaryRow}>
                    Note: {entry.note}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </Panel.Table>
  );
}
