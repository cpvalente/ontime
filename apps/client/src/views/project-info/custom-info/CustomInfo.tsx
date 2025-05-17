import { Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProjectData } from 'ontime-types';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';

interface CustomInfoProps {
  general: ProjectData;
}

export default function CustomInfo(props: CustomInfoProps) {
  const { general } = props;
  const [searchParams] = useSearchParams();

  const showCustom = isStringBoolean(searchParams.get('showCustom'));

  if (!showCustom || general.custom === undefined || general.custom.length === 0) {
    return null;
  }

  return (
    <>
      {general.custom.map((info, idx) => {
        if (!info.title || !info.value) {
          return null;
        }
        return (
          <Fragment key={`${info.title}-${idx}`}>
            <div className='info__label'>{info.title}</div>
            <div className='info__value'>{info.value}</div>
          </Fragment>
        );
      })}
    </>
  );
}
