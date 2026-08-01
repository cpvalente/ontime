import { useEffect, useState } from 'react';

import Tag from '../../../../common/components/tag/Tag';
import useSessionStats from '../../../../common/hooks-query/useSessionStats';
import { formatDuration } from '../../../../common/utils/time';
import * as Panel from '../../panel-utils/PanelUtils';

/** uptime is shown in minutes, a slow tick keeps it moving between query refetches */
const tickInterval = 30000;

export default function ServerStatus() {
  const { data, isError } = useSessionStats();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), tickInterval);
    return () => clearInterval(tick);
  }, []);

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Server status</Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Panel.Description>
            A summary of the running server, useful when checking whether clients and integrations are reaching Ontime.
          </Panel.Description>
          {isError && <Panel.Error>Could not fetch session information</Panel.Error>}
        </Panel.Section>
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field title='Connected clients' description='Ontime views and integrations currently connected' />
            <Tag>{data.connectedClients}</Tag>
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='Uptime' description='Time since the server was started' />
            <Tag>{formatUptime(data.startedAt, now)}</Tag>
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='Last client connection' description='When a client last connected to the server' />
            <Tag>{formatSince(data.lastConnection, now)}</Tag>
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Last integration request'
              description='When an OSC, HTTP or websocket integration last reached the API'
            />
            <Tag>{formatSince(data.lastRequest, now)}</Tag>
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='Server timezone' description='Timezone reported by the machine running Ontime' />
            <Tag>{data.timezone || '—'}</Tag>
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='Server version' description='Version of the Ontime server' />
            <Tag>{data.version}</Tag>
          </Panel.ListItem>
        </Panel.ListGroup>
      </Panel.Card>
    </Panel.Section>
  );
}

/** the placeholder carries an empty startedAt, which we show as unknown rather than a bogus duration */
function formatUptime(startedAt: string, now: number): string {
  if (!startedAt) {
    return '—';
  }
  const elapsed = now - new Date(startedAt).getTime();
  if (Number.isNaN(elapsed)) {
    return '—';
  }
  return elapsed < 60000 ? 'less than a minute' : formatDuration(elapsed);
}

function formatSince(timestamp: string | null, now: number): string {
  if (timestamp === null) {
    return 'never';
  }
  const elapsed = now - new Date(timestamp).getTime();
  if (Number.isNaN(elapsed)) {
    return '—';
  }
  return elapsed < 60000 ? 'just now' : `${formatDuration(elapsed)} ago`;
}
