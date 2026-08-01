import { MaybeString, MessageTag } from 'ontime-types';
import { MILLIS_PER_MINUTE } from 'ontime-utils';
import { useEffect } from 'react';

import Tag from '../../../../common/components/tag/Tag';
import useSessionStats from '../../../../common/hooks-query/useSessionStats';
import { usePing } from '../../../../common/hooks/useSocket';
import { useClientStore } from '../../../../common/stores/clientStore';
import { formatDuration } from '../../../../common/utils/time';
import { sendSocket } from '../../../../common/utils/socket';
import { isDocker } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

/** ping values above this are flagged to the user (ms) */
const slowPingThreshold = 100;

/** how often we ask the server for a ping (ms) */
const pingInterval = 5000;

/**
 * Presents a date as the time elapsed since it happened
 */
function timeSince(date: MaybeString): string {
  if (date === null) {
    return 'Never';
  }

  const elapsed = Date.now() - new Date(date).getTime();
  if (elapsed < MILLIS_PER_MINUTE) {
    return 'Just now';
  }
  return `${formatDuration(elapsed)} ago`;
}

export default function NetworkStatus() {
  const { data, status, isError } = useSessionStats();
  // the client list is kept up to date over websocket, unlike the polled session stats
  const clients = useClientStore((store) => store.clients);

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Server status</Panel.SubHeader>
        <Panel.Loader isLoading={status === 'pending'} />
        {isError && <Panel.Error>Failed to load session data</Panel.Error>}
        <Panel.Divider />
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field title='Connected clients' description='Clients currently connected to this server' />
            <Tag>{Object.keys(clients).length}</Tag>
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='Server running for' description='Time since the Ontime server was started' />
            <Tag>{data ? formatDuration(Date.now() - new Date(data.startedAt).getTime()) : '...'}</Tag>
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='Last client connection' description='When a client last connected to the server' />
            <Tag>{data ? timeSince(data.lastConnection) : '...'}</Tag>
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Last integration request'
              description='When the server last received a request from an integration'
            />
            <Tag>{data ? timeSince(data.lastRequest) : '...'}</Tag>
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='Server time zone' description='Time zone used by the machine running Ontime' />
            <Tag>{data ? data.timezone : '...'}</Tag>
          </Panel.ListItem>
          {isDocker && <CloudPing />}
        </Panel.ListGroup>
      </Panel.Card>
    </Panel.Section>
  );
}

/**
 * Ontime cloud users are not in the same network as the server
 * we show the round trip time to help them qualify the connection
 */
function CloudPing() {
  const ping = usePing();

  /**
   * Send immediate ping request, and keep sending on an interval
   */
  useEffect(() => {
    sendSocket(MessageTag.Ping, new Date());

    const doPing = setInterval(() => {
      sendSocket(MessageTag.Ping, new Date());
    }, pingInterval);

    return () => {
      clearInterval(doPing);
    };
  }, []);

  return (
    <Panel.ListItem>
      <Panel.Field
        title='Ontime cloud latency'
        description='Time for a message to travel to the server and back. Lower is better'
      />
      <Tag variant={ping > slowPingThreshold ? 'warning' : 'default'}>{ping}ms</Tag>
    </Panel.ListItem>
  );
}
