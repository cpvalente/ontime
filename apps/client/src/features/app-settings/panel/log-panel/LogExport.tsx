import { MouseEvent } from 'react';
import { Button } from '@chakra-ui/react';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';

import { handleLinks } from '../../../../common/utils/linkUtils';
import Log from '../../../log/Log';
import * as Panel from '../PanelUtils';

import style from './LogExport.module.scss';

export default function LogExport() {
  const extract = (event: MouseEvent) => {
    handleLinks(event, 'log');
  };

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>
          Network log
          <Button
            variant='ontime-subtle'
            size='sm'
            rightIcon={<IoArrowUp className={style.iconRotate} />}
            onClick={extract}
          >
            Extract
          </Button>
        </Panel.SubHeader>
        <Panel.Divider />
        <Log />
      </Panel.Card>
    </Panel.Section>
  );
}
