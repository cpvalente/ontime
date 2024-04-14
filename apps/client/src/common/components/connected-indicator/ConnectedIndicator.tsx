import { CSSProperties } from 'react';
import { Alert, AlertIcon, Tooltip } from '@chakra-ui/react';

import { useAppMode } from '../../stores/appModeStore';

import moduleStyle from './ConnectedIndicator.module.scss';

export function ConnectedIndicator(props: { style?: CSSProperties }) {
  const { connected } = useAppMode();
  const { style } = props;
  return (
    <Alert status='error' variant='ontime-transparent-warn' marginLeft='10' width='10' style={style}>
      <Tooltip label='Server Disconnected!'>
        <span>
          <AlertIcon hidden={!connected} className={moduleStyle.blink} />
        </span>
      </Tooltip>
    </Alert>
  );
}
