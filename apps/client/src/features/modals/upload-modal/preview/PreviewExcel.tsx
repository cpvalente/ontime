import { OntimeRundown, UserFields } from 'ontime-types';

import PreviewRundown from './PreviewRundown';

import style from '../../Modal.module.scss';

interface PreviewExcelProps {
  rundown: OntimeRundown;
  userFields: UserFields;
}

export default function PreviewExcel(props: PreviewExcelProps) {
  const { rundown, userFields } = props;

  return (
    <div className={`${style.column}`}>
      <div className={style.title}>Review Rundown</div>
      <PreviewRundown rundown={rundown} userFields={userFields} />
    </div>
  );
}
