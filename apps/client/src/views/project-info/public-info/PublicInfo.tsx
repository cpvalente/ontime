import { useSearchParams } from 'react-router-dom';
import { ProjectData } from 'ontime-types';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';
import { useTranslation } from '../../../translation/TranslationProvider';

interface PublicInfoProps {
  general: ProjectData;
}

export default function PublicInfo(props: PublicInfoProps) {
  const { general } = props;
  const [searchParams] = useSearchParams();
  const { getLocalizedString } = useTranslation();

  const showPublic = isStringBoolean(searchParams.get('showPublic'));

  if (!showPublic) {
    return null;
  }

  return (
    <>
      {general.publicInfo && (
        <>
          <div className='info__label'>{getLocalizedString('project.public_info')}</div>
          <div className='info__value'>{general.publicInfo}</div>
        </>
      )}
      {general.publicUrl && (
        <>
          <div className='info__label'>{getLocalizedString('project.public_url')}</div>
          <a href={general.publicUrl} target='_blank' rel='noreferrer' className='info__value'>
            {general.publicUrl}
          </a>
        </>
      )}
    </>
  );
}
