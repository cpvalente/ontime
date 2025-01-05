import { MouseEvent } from 'react';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';

import { handleLinks } from '../../../../common/utils/linkUtils';
import { Button } from '../../../../components/ui/button';
import Log from '../../../log/Log';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './NetworkLogExport.module.scss';

export default function LogExport() {
  const extract = (event: MouseEvent) => {
    handleLinks(event, 'log');
  };

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>
          Event log
          <Button variant='ontime-subtle' size='sm' onClick={extract}>
            Extract <IoArrowUp className={style.iconRotate} />
          </Button>
        </Panel.SubHeader>
        <Panel.Divider />
        <Log />
      </Panel.Card>
    </Panel.Section>
  );
}
