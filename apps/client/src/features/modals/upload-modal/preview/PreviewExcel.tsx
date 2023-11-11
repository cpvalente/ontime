import { OntimeRundown, ProjectData, UserFields } from 'ontime-types';

import PreviewProjectData from './PreviewProjectData';
import PreviewRundown from './PreviewRundown';

import style from '../../Modal.module.scss';

interface PreviewExcelProps {
  rundown: OntimeRundown;
  project: ProjectData;
  userFields: UserFields;
}

export default function PreviewExcel(props: PreviewExcelProps) {
  const { rundown, project, userFields } = props;

  return (
    <div className={`${style.column}`}>
      <div className={style.title}>Review Project Data</div>
      <PreviewProjectData project={project} />
      <div className={style.vSpacer} />
      <div className={style.title}>Review Rundown</div>
      <PreviewRundown rundown={rundown} userFields={userFields} />
    </div>
  );
}
