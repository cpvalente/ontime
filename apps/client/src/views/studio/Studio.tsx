import { OntimeView } from 'ontime-types';
import { useMemo } from 'react';

import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { cx } from '../../common/utils/styleUtils';
import { getDefaultFormat } from '../../common/utils/time';
import ViewLoadError from '../common/load-error/ViewLoadError';
import Loader from '../common/loader/Loader';
import { getStudioOptions, useStudioOptions } from './studio.options';
import StudioClock from './StudioClock';
import StudioTimers from './StudioTimers';

import './Studio.scss';
import { StudioData, useStudioData } from './useStudioData';

export default function StudioLoader() {
  const { data, status } = useStudioData();

  useWindowTitle('Studio Clock');

  if (status === 'pending') {
    return <Loader />;
  }

  if (status === 'error') {
    return <ViewLoadError />;
  }

  return <Studio {...data} />;
}

function Studio({ customFields, projectData, isMirrored, settings }: StudioData) {
  const { hideCards } = useStudioOptions();

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const studioOptions = useMemo(() => getStudioOptions(defaultFormat, customFields), [defaultFormat, customFields]);

  return (
    <div className={cx(['studio', isMirrored && 'mirror'])} data-testid='studio-view'>
      <ViewParamsEditor target={OntimeView.StudioClock} viewOptions={studioOptions} />

      <div className='project-header'>
        <div className={cx(['project-header__brand', !projectData?.logo && 'project-header__brand--without-logo'])}>
          {projectData?.logo && <ViewLogo name={projectData.logo} className='logo' />}
          <div className='title'>{projectData.title}</div>
        </div>
      </div>

      <div className={cx(['studio-contents', hideCards && 'studio-contents--onecol'])}>
        <StudioClock hideCards={hideCards} />
        {!hideCards && <StudioTimers />}
      </div>
    </div>
  );
}
