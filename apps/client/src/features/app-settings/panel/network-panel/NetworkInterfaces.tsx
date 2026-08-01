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
        // show the resolved URL so the label matches what copy and click actually give the user
        const address = stripTrailingSlash(linkToOtherHost(nif.address));

        return (
          <CopyTag key={nif.name} copyValue={address} onClick={() => handleClick(address)}>
            {`${nif.name} - ${address}`} <IoArrowUp className={style.goIcon} />
          </CopyTag>
        );
      })}
    </Panel.InlineElements>
  );
}

/** URL.toString() adds a trailing slash to bare origins, which reads as noise in a copiable address */
function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
