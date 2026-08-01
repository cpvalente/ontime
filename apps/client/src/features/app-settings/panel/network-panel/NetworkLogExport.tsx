import { MouseEvent } from 'react';
import { IoArrowUp } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import { handleLinks } from '../../../../common/utils/linkUtils';
import Log from '../../../log/Log';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './NetworkLogExport.module.scss';

export default function LogExport() {
  const extract = (event: MouseEvent) => {
    handleLinks('log', event);
  };

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>
          Event log
          <Button onClick={extract}>
            Open in new window <IoArrowUp className={style.iconRotate} />
          </Button>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Panel.Description>
            Activity reported by the server, this client and any connected integrations. Entries are kept for this
            session only.
          </Panel.Description>
        </Panel.Section>
        <Log />
      </Panel.Card>
    </Panel.Section>
  );
}
