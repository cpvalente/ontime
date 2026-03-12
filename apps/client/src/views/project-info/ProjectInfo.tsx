import { OntimeView } from 'ontime-types';
import { IoOpenOutline } from 'react-icons/io5';

import EmptyPage from '../../common/components/state/EmptyPage';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { useTranslation } from '../../translation/TranslationProvider';
import Loader from '../common/loader/Loader';
import { ProjectInfoData, useProjectInfoData } from './useProjectInfoData';

import './ProjectInfo.scss';

export default function ProjectInfoLoader() {
  const { data, status } = useProjectInfoData();

  useWindowTitle('Project info');

  if (status === 'pending') {
    return <Loader />;
  }

  if (status === 'error') {
    return <EmptyPage text='There was an error fetching data, please refresh the page.' />;
  }

  return <ProjectInfo {...data} />;
}

function ProjectInfo({ projectData, isMirrored }: ProjectInfoData) {
  const { getLocalizedString } = useTranslation();

  /**
   * Check if there is data to show at all
   * We need a special check for the project fields which can be an empty array
   */
  const isEmpty =
    !projectData ||
    Object.values(projectData).every((value) => !value || (value && Array.isArray(value) && value.length === 0));
  if (isEmpty) {
    return (
      <>
        <ViewParamsEditor target={OntimeView.ProjectInfo} viewOptions={[]} />
        <EmptyPage text={getLocalizedString('common.no_data')} />;
      </>
    );
  }

  return (
    <div className={`project ${isMirrored ? 'mirror' : ''}`} data-testid='project-view'>
      <ViewParamsEditor target={OntimeView.ProjectInfo} viewOptions={[]} />
      {projectData.logo && <ViewLogo name={projectData.logo} className='logo' />}
      <div className='info'>
        {projectData.title && (
          <div>
            <div className='info__label'>{getLocalizedString('project.title')}</div>
            <div className='info__value'>{projectData.title}</div>
          </div>
        )}
        {projectData.description && (
          <div>
            <div className='info__label'>{getLocalizedString('project.description')}</div>
            <div className='info__value'>{projectData.description}</div>
          </div>
        )}
        {projectData.info && (
          <div>
            <div className='info__label'>{getLocalizedString('project.info')}</div>
            <div className='info__value'>{projectData.info}</div>
          </div>
        )}
        {projectData.url && (
          <div>
            <div className='info__label'>{getLocalizedString('project.url')}</div>
            <a href={projectData.url} target='_blank' rel='noreferrer' className='info__value link'>
              {projectData.url} <IoOpenOutline style={{ fontSize: '1em' }} />
            </a>
          </div>
        )}
        {projectData.custom.map((info, idx) => {
          const hasUrl = Boolean(info.url);
          return (
            <div key={`${info.title}-${idx}`} className='info__custom'>
              {hasUrl && (
                <div className='info__image-container'>
                  <img className='info__image' src={info.url} loading='lazy' />
                </div>
              )}
              <div>
                <div className='info__label'>{info.title}</div>
                <div className='info__value'>{info.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
