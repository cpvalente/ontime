import { IoArrowUp } from 'react-icons/io5';

import CopyTag from '../../../../common/components/copy-tag/CopyTag';
import useInfo from '../../../../common/hooks-query/useInfo';
import { linkToOtherHost, openLink } from '../../../../common/utils/linkUtils';
import { isLocalhost } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './NetworkInterfaces.module.scss';

export default function InfoNif() {
  const { data } = useInfo();

  const handleClick = (address: string) => openLink(address);

  return (
    <Panel.InlineElements wrap='wrap'>
      {data.networkInterfaces.map((nif) => {
        // interfaces outside localhost wont have access
        if (nif.name === 'localhost' && !isLocalhost) return null;
        const address = linkToOtherHost(nif.address);
        // we show the address as it would be typed in a browser, including the port
        const label = new URL(address).host;

        return (
          <CopyTag key={`${nif.name}-${nif.address}`} copyValue={address} onClick={() => handleClick(address)}>
            {`${nif.name} - ${label}`} <IoArrowUp className={style.goIcon} />
          </CopyTag>
        );
      })}
    </Panel.InlineElements>
  );
}
