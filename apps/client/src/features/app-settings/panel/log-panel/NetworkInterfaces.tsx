import { serverPort } from '../../../../common/api/constants';
import AppLink from '../../../../common/components/app-link/AppLink';
import useInfo from '../../../../common/hooks-query/useInfo';

import style from './NetworkInterfaces.module.scss';

export default function InfoNif() {
  const { data } = useInfo();

  return (
    <div className={style.interfaces}>
      {data?.networkInterfaces?.map((nif) => (
        <AppLink key={nif.address} href={`http://${nif.address}:${serverPort}`}>
          {`${nif.name} - ${nif.address}`}
        </AppLink>
      ))}
    </div>
  );
}
