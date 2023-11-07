import { Fragment } from 'react';
import { isOntimeEvent, OntimeRundown, UserFields } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { getAccessibleColour } from '../../../../common/utils/styleUtils';

import Tag from './Tag';

import style from './PreviewTable.module.scss';

interface PreviewRundownProps {
  rundown: OntimeRundown;
  userFields: UserFields;
}

function booleanToText(value?: boolean) {
  return value ? 'Yes' : undefined;
}

export default function PreviewRundown({ rundown, userFields }: PreviewRundownProps) {
  return (
    <div className={style.container}>
      <table className={style.rundownPreview}>
        <thead className={style.header}>
          <tr>
            <th>#</th>
            <th>Type</th>
            <th>Cue</th>
            <th>Title</th>
            <th>Subtitle</th>
            <th>Presenter</th>
            <th>Time Start</th>
            <th>Time End</th>
            <th>Duration</th>
            <th>Is Public</th>
            <th>Skip</th>
            <th>Colour</th>
            <th>Timer Type</th>
            <th>End Action</th>
            <th>
              user0 <Tag>{userFields.user0}</Tag>
            </th>
            <th>
              user1 <Tag>{userFields.user1}</Tag>
            </th>
            <th>
              user2 <Tag>{userFields.user2}</Tag>
            </th>
            <th>
              user3 <Tag>{userFields.user3}</Tag>
            </th>
            <th>
              user4 <Tag>{userFields.user4}</Tag>
            </th>
            <th>
              user5 <Tag>{userFields.user5}</Tag>
            </th>
            <th>
              user6 <Tag>{userFields.user6}</Tag>
            </th>
            <th>
              user7 <Tag>{userFields.user7}</Tag>
            </th>
            <th>
              user8 <Tag>{userFields.user8}</Tag>
            </th>
            <th>
              user9 <Tag>{userFields.user9}</Tag>
            </th>
          </tr>
        </thead>
        <tbody className={style.body}>
          {rundown.map((event, index) => {
            if (!isOntimeEvent(event)) {
              return null;
            }
            const key = event.id;
            const colour = event.colour ? getAccessibleColour(event.colour) : {};
            const isPublic = booleanToText(event.isPublic);
            const skip = booleanToText(event.skip);
            return (
              <Fragment key={key}>
                <tr>
                  <td className={style.center}>
                    <Tag>{index + 1}</Tag>
                  </td>
                  <td className={style.center}>
                    <Tag>Event</Tag>
                  </td>
                  <td className={style.nowrap}>{event.cue}</td>
                  <td>{event.title}</td>
                  <td>{event.subtitle}</td>
                  <td>{event.presenter}</td>
                  <td>{millisToString(event.timeStart)}</td>
                  <td>{millisToString(event.timeEnd)}</td>
                  <td>{millisToString(event.duration)}</td>
                  <td className={style.center}>{isPublic && <Tag>{isPublic}</Tag>}</td>
                  <td>{skip && <Tag>{skip}</Tag>}</td>
                  <td style={{ ...colour }}>{event.colour}</td>
                  <td className={style.center}>
                    <Tag>{event.timerType}</Tag>
                  </td>
                  <td className={style.center}>
                    <Tag>{event.endAction}</Tag>
                  </td>
                  <td>{event.user0}</td>
                  <td>{event.user1}</td>
                  <td>{event.user2}</td>
                  <td>{event.user3}</td>
                  <td>{event.user4}</td>
                  <td>{event.user5}</td>
                  <td>{event.user6}</td>
                  <td>{event.user7}</td>
                  <td>{event.user8}</td>
                  <td>{event.user9}</td>
                </tr>
                {event.note && (
                  <tr>
                    <td colSpan={99} className={style.secondaryRow}>
                      Note: {event.note}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
