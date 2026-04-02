import useProjectData from '../../../common/hooks-query/useProjectData';
import { useRundownAuxData } from '../../../common/hooks-query/useRundown';

import style from './TitleOverview.module.scss';

export default function TitleOverview() {
  'use memo';
  const { data: projectData } = useProjectData();
  const { data: rundownData } = useRundownAuxData();

  if (!projectData.title && !rundownData.title) {
    return null;
  }

  return (
    <div>
      <div className={style.title}>{projectData.title}</div>
      <div className={style.description}>{rundownData.title}</div>
    </div>
  );
}
