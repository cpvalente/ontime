import { UserFields } from 'ontime-types';

import style from './PreviewColumn.module.scss';

interface PreviewUserFieldProps {
  userFields: UserFields;
}

export default function PreviewUserField({ userFields }: PreviewUserFieldProps) {
  return (
    <div className={style.previewTable}>
      <span className={style.field}>user0</span>
      <span className={style.value}>{userFields.user0}</span>
      <span className={style.field}>user1</span>
      <span className={style.value}>{userFields.user1}</span>
      <span className={style.field}>user2</span>
      <span className={style.value}>{userFields.user2}</span>
      <span className={style.field}>user3</span>
      <span className={style.value}>{userFields.user3}</span>
      <span className={style.field}>user4</span>
      <span className={style.value}>{userFields.user4}</span>
      <span className={style.field}>user5</span>
      <span className={style.value}>{userFields.user5}</span>
      <span className={style.field}>user6</span>
      <span className={style.value}>{userFields.user6}</span>
      <span className={style.field}>user7</span>
      <span className={style.value}>{userFields.user7}</span>
      <span className={style.field}>user8</span>
      <span className={style.value}>{userFields.user8}</span>
      <span className={style.field}>user9</span>
      <span className={style.value}>{userFields.user9}</span>
    </div>
  );
}
