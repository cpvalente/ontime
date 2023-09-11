import { ReactNode } from 'react';
import { isOntimeEvent, OntimeRundown, UserFields } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { getAccessibleColour } from '../../utils/styleUtils';

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
      <div className={style.scrollContainer}>
        <table className={style.rundownPreview}>
          <thead className={style.header}>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Cue</th>
              <th>Title</th>
              <th>Subtitle</th>
              <th>Presenter</th>
              <th>Note</th>
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
              const key = event.id;
              if (isOntimeEvent(event)) {
                const colour = event.colour ? getAccessibleColour(event.colour) : {};
                const isPublic = booleanToText(event.isPublic);
                const skip = booleanToText(event.skip);
                return (
                  <tr key={key}>
                    <th>
                      <Tag>{index + 1}</Tag>
                    </th>
                    <th>Event</th>
                    <th>{event.cue}</th>
                    <th>{event.title}</th>
                    <th>{event.subtitle}</th>
                    <th>{event.presenter}</th>
                    <th>{event.note}</th>
                    <th>{millisToString(event.timeStart)}</th>
                    <th>{millisToString(event.timeEnd)}</th>
                    <th>{millisToString(event.duration)}</th>
                    <th>{isPublic && <Tag>{isPublic}</Tag>}</th>
                    <th>{skip && <Tag>{skip}</Tag>}</th>
                    <th style={{ ...colour }}>{event.colour}</th>
                    <th>
                      <Tag>{event.timerType}</Tag>
                    </th>
                    <th>
                      <Tag>{event.endAction}</Tag>
                    </th>
                    <th>{event.user0}</th>
                    <th>{event.user1}</th>
                    <th>{event.user2}</th>
                    <th>{event.user3}</th>
                    <th>{event.user4}</th>
                    <th>{event.user5}</th>
                    <th>{event.user6}</th>
                    <th>{event.user7}</th>
                    <th>{event.user8}</th>
                    <th>{event.user9}</th>
                  </tr>
                );
              }
              return null;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span className={style.tag}>{children}</span>;
}
