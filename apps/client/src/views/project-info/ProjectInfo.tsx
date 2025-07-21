import { IoOpenOutline } from 'react-icons/io5';

import ViewNavigationMenu from '../../common/components/navigation-menu/ViewNavigationMenu';
import EmptyPage from '../../common/components/state/EmptyPage';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useProjectData from '../../common/hooks-query/useProjectData';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { useTranslation } from '../../translation/TranslationProvider';

import './ProjectInfo.scss';
import { OntimeView } from 'ontime-types';

export default function ProjectInfo() {
  // persisted app state
  const isMirrored = useViewOptionsStore((state) => state.mirror);
  const { data, status } = useProjectData();
  const { getLocalizedString } = useTranslation();

  useWindowTitle('Project info');

  if (status === 'pending' || !data) {
    return (
      <>
        <ViewNavigationMenu isLockable suppressSettings />
        <ViewParamsEditor target={OntimeView.ProjectInfo} viewOptions={[]} />
        <EmptyPage text={getLocalizedString('common.no_data')} />;
      </>
    );
  }

  /**
   * Check if there is data to show at all
   * We need a special check for the project fields which can be an empty array
   */
  const isEmpty = Object.values(data).every((value) => !value || (value && Array.isArray(value) && value.length === 0));
  if (isEmpty) {
    return (
      <>
        <ViewNavigationMenu isLockable suppressSettings />
        <ViewParamsEditor target={OntimeView.ProjectInfo} viewOptions={[]} />
        <EmptyPage text={getLocalizedString('common.no_data')} />;
      </>
    );
  }

  return (
    <div className={`project ${isMirrored ? 'mirror' : ''}`} data-testid='project-view'>
      <ViewNavigationMenu isLockable suppressSettings />
      <ViewParamsEditor target={OntimeView.ProjectInfo} viewOptions={[]} />
      {data.logo && <ViewLogo name={data.logo} className='logo' />}
      <div className='info'>
        {data.title && (
          <div>
            <div className='info__label'>{getLocalizedString('project.title')}</div>
            <div className='info__value'>{data.title}</div>
          </div>
        )}
        {data.description && (
          <div>
            <div className='info__label'>{getLocalizedString('project.description')}</div>
            <div className='info__value'>{data.description}</div>
          </div>
        )}
        {data.info && (
          <div>
            <div className='info__label'>{getLocalizedString('project.info')}</div>
            <div className='info__value'>{data.info}</div>
          </div>
        )}
        {data.url && (
          <div>
            <div className='info__label'>{getLocalizedString('project.url')}</div>
            <a href={data.url} target='_blank' rel='noreferrer' className='info__value link'>
              {data.url} <IoOpenOutline style={{ fontSize: '1em' }} />
            </a>
          </div>
        )}
        {data.custom.map((info, idx) => {
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
