import { IoArrowUp } from 'react-icons/io5';

import CopyTag from '../../../../common/components/copy-tag/CopyTag';
import useInfo from '../../../../common/hooks-query/useInfo';
import { linkToOtherHost, openLink } from '../../../../common/utils/linkUtils';
import { isLocalhost } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './NetworkInterfaces.module.scss';

export default function InfoNif() {
  const { data, isLoading } = useInfo();

  const handleClick = (address: string) => openLink(address);

  return (
    <Panel.InlineElements>
      <Panel.Loader isLoading={isLoading} />
      {data.networkInterfaces.map((nif) => {
        // interfaces outside localhost wont have access
        if (nif.name === 'localhost' && !isLocalhost) return null;
        const address = linkToOtherHost(nif.address);

        return (
          <CopyTag key={nif.name} copyValue={address} onClick={() => handleClick(address)}>
            {`${nif.name} - ${nif.address}`} <IoArrowUp className={style.goIcon} />
          </CopyTag>
        );
      })}
    </Panel.InlineElements>
  );
}
