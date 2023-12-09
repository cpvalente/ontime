import { memo, PropsWithChildren } from 'react';

import useUserFields from '../../../common/hooks-query/useUserFields';
import EditableCell from '../../cuesheet/cuesheet-table-elements/EditableCell';
import { EditorUpdateFields } from '../EventEditor';

// import CountedTextArea from './CountedTextArea';
import style from '../EventEditor.module.scss';

interface EventEditorRightProps {
  note: string;
  user0: string;
  user1: string;
  user2: string;
  user3: string;
  user4: string;
  user5: string;
  user6: string;
  user7: string;
  user8: string;
  user9: string;
  handleSubmit: (field: EditorUpdateFields, value: string) => void;
}

const EventEditorDataRight = (props: PropsWithChildren<EventEditorRightProps>) => {
  const { children, note, user0, user1, user2, user3, user4, user5, user6, user7, user8, user9, handleSubmit } = props;

  const { data, isFetching } = useUserFields();

  return (
    <div className={style.right}>
      {isFetching && !data && 'Loading User Notes'}
      {data && (
        <table className={`${style.notes}`}>
          <thead className={`${style.noteHeader}`}>
            <tr>
              <td>User</td>
              <td>Note</td>
            </tr>
          </thead>
          <tbody>
            <tr className={`${style.noteRow}`}>
              <td>All Users</td>
              <td>
                <EditableCell
                  handleUpdate={(value) => {
                    handleSubmit('note', value);
                  }}
                  value={note}
                />
              </td>
            </tr>
            <tr className={`${style.noteRow}`}>
              <td>{data?.user0}</td>
              <td>
                <EditableCell
                  handleUpdate={(value) => {
                    handleSubmit('user0', value);
                  }}
                  value={user0}
                />
              </td>
            </tr>
            <tr className={`${style.noteRow}`}>
              <td>{data?.user1}</td>
              <td>
                <EditableCell
                  handleUpdate={(value) => {
                    handleSubmit('user1', value);
                  }}
                  value={user1}
                />
              </td>
            </tr>
            <tr className={`${style.noteRow}`}>
              <td>{data?.user2}</td>
              <td>
                <EditableCell
                  handleUpdate={(value) => {
                    handleSubmit('user2', value);
                  }}
                  value={user2}
                />
              </td>
            </tr>
            <tr className={`${style.noteRow}`}>
              <td>{data?.user3}</td>
              <td>
                <EditableCell
                  handleUpdate={(value) => {
                    handleSubmit('user3', value);
                  }}
                  value={user3}
                />
              </td>
            </tr>
            <tr className={`${style.noteRow}`}>
              <td>{data?.user4}</td>
              <td>
                <EditableCell
                  handleUpdate={(value) => {
                    handleSubmit('user4', value);
                  }}
                  value={user4}
                />
              </td>
            </tr>
            <tr className={`${style.noteRow}`}>
              <td>{data?.user5}</td>
              <td>
                <EditableCell
                  handleUpdate={(value) => {
                    handleSubmit('user5', value);
                  }}
                  value={user5}
                />
              </td>
            </tr>
            <tr className={`${style.noteRow}`}>
              <td>{data?.user6}</td>
              <td>
                <EditableCell
                  handleUpdate={(value) => {
                    handleSubmit('user6', value);
                  }}
                  value={user6}
                />
              </td>
            </tr>
            <tr className={`${style.noteRow}`}>
              <td>{data?.user7}</td>
              <td>
                <EditableCell
                  handleUpdate={(value) => {
                    handleSubmit('user7', value);
                  }}
                  value={user7}
                />
              </td>
            </tr>
            <tr className={`${style.noteRow}`}>
              <td>{data?.user8}</td>
              <td>
                <EditableCell
                  handleUpdate={(value) => {
                    handleSubmit('user8', value);
                  }}
                  value={user8}
                />
              </td>
            </tr>
            <tr className={`${style.noteRow}`}>
              <td>{data?.user9}</td>
              <td>
                <EditableCell
                  handleUpdate={(value) => {
                    handleSubmit('user9', value);
                  }}
                  value={user9}
                />
              </td>
            </tr>
          </tbody>
        </table>
      )}{' '}
      <div className={style.eventActions}>{children}</div>
    </div>
  );
};

export default memo(EventEditorDataRight);
