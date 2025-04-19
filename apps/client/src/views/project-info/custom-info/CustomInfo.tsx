import { useSearchParams } from 'react-router-dom';
import { ProjectData } from 'ontime-types';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';
import { useTranslation } from '../../../translation/TranslationProvider';

interface CustomInfoProps {
  general: ProjectData;
}

export default function CustomInfo(props: CustomInfoProps) {
  const { general } = props;
  const [searchParams] = useSearchParams();
  const { getLocalizedString } = useTranslation();

  const showCustom = isStringBoolean(searchParams.get('showCustom'));

  if (!showCustom) {
    return null;
  }

  return (
    <>
      {general.custom && general.custom.length > 0 && (
        <>
          <div className='info__label'>{getLocalizedString('project.custom')}</div>
          {general.custom &&
            general.custom.map((info, idx) => (
              <div className='custom_data' key={idx}>
                <p>{info.title}:</p>
                <p>{info.value}</p>
              </div>
            ))}
        </>
      )}
    </>
  );
}
