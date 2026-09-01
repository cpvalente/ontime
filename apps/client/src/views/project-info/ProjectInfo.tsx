import { OntimeView } from 'ontime-types';
import { type ReactNode, useState } from 'react';
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
    return <EmptyPage variant='error' text='There was an error fetching data, please refresh the page.' />;
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
        <EmptyPage text={getLocalizedString('common.no_data')} />
      </>
    );
  }

  const hasHeader = Boolean(projectData.logo || projectData.title || projectData.description);

  return (
    <div className={`project ${isMirrored ? 'mirror' : ''}`} data-testid='project-view'>
      <ViewParamsEditor target={OntimeView.ProjectInfo} viewOptions={[]} />
      {hasHeader && (
        <div className='project-header'>
          {projectData.logo && <ViewLogo name={projectData.logo} className='logo' />}
          <div className='project-header__text'>
            {projectData.title && <div className='title'>{projectData.title}</div>}
            {projectData.description && <div className='description'>{projectData.description}</div>}
          </div>
        </div>
      )}
      <div className='info'>
        {projectData.info && <InfoCard label={getLocalizedString('project.info')}>{projectData.info}</InfoCard>}
        {projectData.url && (
          <div className='info__card'>
            <div className='info__label'>{getLocalizedString('project.url')}</div>
            <a href={projectData.url} target='_blank' rel='noreferrer' className='info__value link'>
              {projectData.url}
              <IoOpenOutline style={{ fontSize: '1em' }} />
            </a>
          </div>
        )}
        {projectData.custom.map((info, idx) => {
          return (
            // oxlint-disable-next-line react/no-array-index-key - we only have the index to go of  here
            <div key={`${info.title}-${idx}`} className='info__card'>
              {info.title && <div className='info__label'>{info.title}</div>}
              {info.url ? (
                <div className='info__media'>
                  <InfoImage src={info.url} />
                  {info.value && <div className='info__value'>{info.value}</div>}
                </div>
              ) : (
                info.value && <div className='info__value'>{info.value}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface InfoCardProps {
  label: string;
  children: ReactNode;
}

function InfoCard({ label, children }: InfoCardProps) {
  return (
    <div className='info__card'>
      <div className='info__label'>{label}</div>
      <div className='info__value'>{children}</div>
    </div>
  );
}

function InfoImage({ src }: { src: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  return (
    <div className='info__image-container'>
      <img className='info__image' src={src} loading='lazy' alt='' onError={() => setHasError(true)} />
    </div>
  );
}
