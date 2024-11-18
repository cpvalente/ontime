import { useSearchParams } from 'react-router-dom';
import { ProjectData } from 'ontime-types';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';

interface BackstageInfoProps {
  general: ProjectData;
}

export default function BackstageInfo(props: BackstageInfoProps) {
  const { general } = props;
  const [searchParams] = useSearchParams();

  const showBackstage = isStringBoolean(searchParams.get('showBackstage'));

  if (!showBackstage) {
    return null;
  }

  return (
    <>
      {general.backstageInfo && (
        <>
          <div className='info__label'>Backstage info</div>
          <div className='info__value'>{general.backstageInfo}</div>
        </>
      )}
      {general.backstageUrl && (
        <>
          <div className='info__label'>Backstage URL</div>
          <a href={general.backstageUrl} target='_blank' rel='noreferrer' className='info__value'>
            {general.backstageUrl}
          </a>
        </>
      )}
    </>
  );
}
