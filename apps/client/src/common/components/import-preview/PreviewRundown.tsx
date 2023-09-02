import { isOntimeEvent, OntimeRundown } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { getAccessibleColour } from '../../utils/styleUtils';

import style from './PreviewTable.module.scss';

interface PreviewRundownProps {
  rundown: OntimeRundown;
}

function booleanToText(value?: boolean) {
  return value ? 'Yes' : '';
}

export default function PreviewRundown({ rundown }: PreviewRundownProps) {
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
              <th>user0</th>
              <th>user1</th>
              <th>user2</th>
              <th>user3</th>
              <th>user4</th>
              <th>user5</th>
              <th>user6</th>
              <th>user7</th>
              <th>user8</th>
              <th>user9</th>
            </tr>
          </thead>
          <tbody className={style.body}>
            {rundown.map((event, index) => {
              const key = event.id;
              if (isOntimeEvent(event)) {
                const colour = event.colour ? getAccessibleColour(event.colour) : {};
                return (
                  <tr key={key}>
                    <th>{index + 1}</th>
                    <th>Event</th>
                    <th>{event.cue}</th>
                    <th>{event.title}</th>
                    <th>{event.subtitle}</th>
                    <th>{event.presenter}</th>
                    <th>{event.note}</th>
                    <th>{millisToString(event.timeStart)}</th>
                    <th>{millisToString(event.timeEnd)}</th>
                    <th>{millisToString(event.duration)}</th>
                    <th>{booleanToText(event.isPublic)}</th>
                    <th>{booleanToText(event.skip)}</th>
                    <th style={{ ...colour }}>{event.colour}</th>
                    <th>{event.timerType}</th>
                    <th>{event.endAction}</th>
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
