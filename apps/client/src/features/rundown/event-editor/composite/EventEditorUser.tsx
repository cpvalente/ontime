import { UserFields } from 'ontime-types';

import useUserFields from '../../../../common/hooks-query/useUserFields';
import { EditorUpdateFields } from '../EventEditor';

import EventTextArea from './EventTextArea';

import style from '../EventEditor.module.scss';

interface EventEditorUserProps {
  userFields: UserFields;
  handleSubmit: (field: EditorUpdateFields, value: string) => void;
}

export default function EventEditorUser(props: EventEditorUserProps) {
  const { userFields, handleSubmit } = props;
  const { data } = useUserFields();

  return (
    <div className={style.column}>
      <EventTextArea
        field='user0'
        label={data?.user0 ?? 'user0'}
        initialValue={userFields.user0}
        submitHandler={handleSubmit}
      />
      <EventTextArea
        field='user1'
        label={data?.user1 ?? 'user1'}
        initialValue={userFields.user1}
        submitHandler={handleSubmit}
      />
      <EventTextArea
        field='user2'
        label={data?.user2 ?? 'user2'}
        initialValue={userFields.user2}
        submitHandler={handleSubmit}
      />
      <EventTextArea
        field='user3'
        label={data?.user3 ?? 'user3'}
        initialValue={userFields.user3}
        submitHandler={handleSubmit}
      />
      <EventTextArea
        field='user4'
        label={data?.user4 ?? 'user4'}
        initialValue={userFields.user4}
        submitHandler={handleSubmit}
      />
      <EventTextArea
        field='user5'
        label={data?.user5 ?? 'user5'}
        initialValue={userFields.user5}
        submitHandler={handleSubmit}
      />
      <EventTextArea
        field='user6'
        label={data?.user6 ?? 'user6'}
        initialValue={userFields.user6}
        submitHandler={handleSubmit}
      />
      <EventTextArea
        field='user7'
        label={data?.user7 ?? 'user7'}
        initialValue={userFields.user7}
        submitHandler={handleSubmit}
      />
      <EventTextArea
        field='user8'
        label={data?.user8 ?? 'user8'}
        initialValue={userFields.user8}
        submitHandler={handleSubmit}
      />
      <EventTextArea
        field='user9'
        label={data?.user9 ?? 'user9'}
        initialValue={userFields.user9}
        submitHandler={handleSubmit}
      />
    </div>
  );
}
