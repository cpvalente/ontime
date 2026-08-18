import { IoArrowUp } from 'react-icons/io5';

import useInfo from '../../../hooks-query/useInfo';
import { linkToOtherHost, openLink } from '../../../utils/linkUtils';
import CopyTag from '../../copy-tag/CopyTag';
import Eyebrow from '../../eyebrow/Eyebrow';
import { getExternalInterfaces } from './otherAddresses.utils';

import style from './OtherAddresses.module.scss';

interface OtherAddressesProps {
  currentLocation: string;
}

export default function OtherAddresses({ currentLocation }: OtherAddressesProps) {
  const { data } = useInfo();
  const externalInterfaces = getExternalInterfaces(data.networkInterfaces);

  if (externalInterfaces.length === 0) {
    return null;
  }

  return (
    <div className={style.footer}>
      <div className={style.header}>
        <Eyebrow>Also available at</Eyebrow>
      </div>
      <div className={style.interfaces}>
        {externalInterfaces.map((nif) => {
          const address = linkToOtherHost(nif.address, currentLocation);

          return (
            <div key={nif.name} className={style.interface}>
              <CopyTag copyValue={address} onClick={() => openLink(address)} size='small'>
                <span className={style.interfaceCopy}>
                  <span className={style.address}>{nif.address}</span>
                  <IoArrowUp className={style.goIcon} />
                </span>
              </CopyTag>
            </div>
          );
        })}
      </div>
    </div>
  );
}
