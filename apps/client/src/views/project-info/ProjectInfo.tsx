import { ProjectData } from 'ontime-types';

import Empty from '../../common/components/state/Empty';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';

import BackstageInfo from './backstage-info/BackstageInfo';
import PublicInfo from './public-info/PublicInfo';
import { projectInfoOptions } from './projectInfo.options';

import './ProjectInfo.scss';

interface ProjectInfoProps {
  general: ProjectData;
  isMirrored: boolean;
}

export default function ProjectInfoProps(props: ProjectInfoProps) {
  const { general, isMirrored } = props;

  useWindowTitle('Project info');

  if (!general) {
    return <Empty text='No data found' />;
  }

  return (
    <div className={`project ${isMirrored ? 'mirror' : ''}`} data-testid='project-view'>
      <ViewParamsEditor viewOptions={projectInfoOptions} />
      {general.projectLogo && <ViewLogo name={general.projectLogo} className='logo' />}
      <div className='info'>
        {general.title && (
          <>
            <div className='info__label'>Title</div>
            <div className='info__value'>{general.title}</div>
          </>
        )}
        <BackstageInfo general={general} />
        <PublicInfo general={general} />
      </div>
    </div>
  );
}
