import { OntimeRundown, ProjectData, UserFields } from 'ontime-types';

import PreviewProjectData from '../../../common/components/import-preview/PreviewProjectData';
import PreviewRundown from '../../../common/components/import-preview/PreviewRundown';

import style from '../Modal.module.scss';

interface ReviewFileProps {
  rundown: OntimeRundown;
  project: ProjectData;
  userFields: UserFields;
}

export default function ReviewFile(props: ReviewFileProps) {
  const { rundown, project, userFields } = props;

  return (
    <div className={style.columnSection}>
      <div className={style.title}>Review Project Data</div>
      <PreviewProjectData project={project} />
      <div className={style.title}>Review Rundown</div>
      <PreviewRundown rundown={rundown} userFields={userFields} />
    </div>
  );
}
