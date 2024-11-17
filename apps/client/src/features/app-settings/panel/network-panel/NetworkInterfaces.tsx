import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';

import CopyTag from '../../../../common/components/copy-tag/CopyTag';
import useInfo from '../../../../common/hooks-query/useInfo';
import { openLink } from '../../../../common/utils/linkUtils';
import { isLocalhost, serverPort } from '../../../../externals';

import style from './NetworkInterfaces.module.scss';

export default function InfoNif() {
  const { data } = useInfo();

  const handleClick = (address: string) => openLink(address);

  return (
    <div className={style.interfaces}>
      {data.networkInterfaces?.map((nif) => {
        // interfaces outside localhost wont have access
        if (nif.name === 'localhost' && !isLocalhost) return null;

        const address = `http://${nif.address}:${serverPort}`;
        return (
          <CopyTag
            key={nif.name}
            copyValue={address}
            onClick={() => handleClick(address)}
            label='Copy IP or navigate to address'
          >
            {`${nif.name} - ${nif.address}`} <IoArrowUp className={style.goIcon} />
          </CopyTag>
        );
      })}
    </div>
  );
}
