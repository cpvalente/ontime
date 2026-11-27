import { useEffect, useState } from 'react';

import { generateUrl } from '../../../../common/api/session';
import CopyTag from '../../../../common/components/copy-tag/CopyTag';
import { serverURL } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

export default function McpSection() {
  const [mcpEndpointUrl, setMcpEndpointUrl] = useState('');

  // generate url
  useEffect(() => {
    // the page origin is reachable wherever the user is browsing from,
    // and follows the deployment (cloud, reverse proxy, port mappings)
    // we are reusing the endpoint, so locking config and nav have no effect
    generateUrl({ baseUrl: serverURL, path: 'mcp', authenticate: true, lockConfig: false, lockNav: false })
      .then(setMcpEndpointUrl)
      .catch(() => {
        setMcpEndpointUrl('');
      });
  }, []);

  const mcpClientConfig = mcpEndpointUrl
    ? JSON.stringify({ mcpServers: { ontime: { url: mcpEndpointUrl } } }, null, 2)
    : '';

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>MCP Server</Panel.SubHeader>
        <Panel.Paragraph>Connect any MCP-compatible AI agent to Ontime using the endpoint below.</Panel.Paragraph>
        <Panel.Divider />
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field title='Endpoint URL' description='Add this URL to your MCP client settings' />
            {mcpEndpointUrl && <CopyTag copyValue={mcpEndpointUrl}>{mcpEndpointUrl}</CopyTag>}
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Client configuration snippet'
              description='Paste this into your AI agent settings under "mcpServers"'
            />
            {mcpEndpointUrl && <CopyTag copyValue={mcpClientConfig}>{mcpClientConfig}</CopyTag>}
          </Panel.ListItem>
        </Panel.ListGroup>
      </Panel.Card>
    </Panel.Section>
  );
}
