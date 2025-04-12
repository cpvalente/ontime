import { ProjectData } from 'ontime-types';

import Empty from '../../common/components/state/Empty';
import EmptyPage from '../../common/components/state/EmptyPage';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { useTranslation } from '../../translation/TranslationProvider';

import BackstageInfo from './backstage-info/BackstageInfo';
import CustomInfo from './custom-info/CustomInfo';
import PublicInfo from './public-info/PublicInfo';
import { projectInfoOptions } from './projectInfo.options';

import './ProjectInfo.scss';

interface ProjectInfoProps {
  general: ProjectData;
  isMirrored: boolean;
}

export default function ProjectInfo(props: ProjectInfoProps) {
  const { general, isMirrored } = props;
  const { getLocalizedString } = useTranslation();

  useWindowTitle('Project info');

  if (!general) {
    return <Empty text={getLocalizedString('common.no_data')} />;
  }

  if (!general) {
    return (
      <>
        <ViewParamsEditor viewOptions={projectInfoOptions} />
        <EmptyPage text={getLocalizedString('common.no_data')} />;
      </>
    );
  }

  const isEmpty = Object.values(general).every((value) => !value);
  if (isEmpty) {
    return (
      <>
        <ViewParamsEditor viewOptions={projectInfoOptions} />
        <EmptyPage text={getLocalizedString('common.no_data')} />;
      </>
    );
  }

  return (
    <div className={`project ${isMirrored ? 'mirror' : ''}`} data-testid='project-view'>
      <ViewParamsEditor viewOptions={projectInfoOptions} />
      {general.projectLogo && <ViewLogo name={general.projectLogo} className='logo' />}
      <div className='info'>
        {general.title && (
          <>
            <div className='info__label'>{getLocalizedString('project.title')}</div>
            <div className='info__value'>{general.title}</div>
          </>
        )}
        {general.description && (
          <>
            <div className='info__label'>{getLocalizedString('project.description')}</div>
            <div className='info__value'>{general.description}</div>
          </>
        )}
        <BackstageInfo general={general} />
        <PublicInfo general={general} />
        <CustomInfo general={general} />
      </div>
    </div>
  );
}
