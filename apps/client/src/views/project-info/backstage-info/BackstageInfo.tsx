import { useSearchParams } from 'react-router';
import { ProjectData } from 'ontime-types';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';
import { useTranslation } from '../../../translation/TranslationProvider';

interface BackstageInfoProps {
  general: ProjectData;
}

export default function BackstageInfo(props: BackstageInfoProps) {
  const { general } = props;
  const [searchParams] = useSearchParams();
  const { getLocalizedString } = useTranslation();

  const showBackstage = isStringBoolean(searchParams.get('showBackstage'));

  if (!showBackstage) {
    return null;
  }

  return (
    <>
      {general.backstageInfo && (
        <>
          <div className='info__label'>{getLocalizedString('project.backstage_info')}</div>
          <div className='info__value'>{general.backstageInfo}</div>
        </>
      )}
      {general.backstageUrl && (
        <>
          <div className='info__label'>{getLocalizedString('project.backstage_url')}</div>
          <a href={general.backstageUrl} target='_blank' rel='noreferrer' className='info__value'>
            {general.backstageUrl}
          </a>
        </>
      )}
    </>
  );
}
