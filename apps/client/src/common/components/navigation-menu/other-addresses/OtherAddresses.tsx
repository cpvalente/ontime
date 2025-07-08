import { IoArrowUp } from 'react-icons/io5';

import useInfo from '../../../hooks-query/useInfo';
import { linkToOtherHost, openLink } from '../../../utils/linkUtils';
import CopyTag from '../../copy-tag/CopyTag';

import style from './OtherAddresses.module.scss';

interface OtherAddressesProps {
  currentLocation: string;
}

export default function OtherAddresses({ currentLocation }: OtherAddressesProps) {
  const { data } = useInfo();

  // there is no point showing this if we only have one interface
  if (data.networkInterfaces.length < 2) {
    return null;
  }

  return (
    <>
      <div className={style.header}>Accessible on external networks</div>
      <div className={style.interfaces}>
        {data?.networkInterfaces?.map((nif) => {
          if (nif.name === 'localhost') {
            return null;
          }

          const address = linkToOtherHost(nif.address, currentLocation);

          return (
            <CopyTag key={nif.name} copyValue={address} onClick={() => openLink(address)}>
              {nif.address} <IoArrowUp className={style.goIcon} />
            </CopyTag>
          );
        })}
      </div>
    </>
  );
}
