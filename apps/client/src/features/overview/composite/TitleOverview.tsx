import useProjectData from '../../../common/hooks-query/useProjectData';
import { useRundownAuxData } from '../../../common/hooks-query/useRundown';

import style from './TitleOverview.module.scss';

export default function TitleOverview() {
  'use memo';
  const { data: projectData } = useProjectData();
  const { data: rundownData } = useRundownAuxData();

  const projectTitle = projectData.title.trim();
  const rundownTitle = rundownData.title.trim();

  if (!projectTitle && !rundownTitle) {
    return null;
  }

  return (
    <div className={style.titleOverview}>
      {projectTitle && <div className={style.project}>{projectTitle}</div>}
      {rundownTitle && <div className={style.rundown}>{rundownTitle}</div>}
    </div>
  );
}
