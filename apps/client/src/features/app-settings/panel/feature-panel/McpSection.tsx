import { useEffect, useState } from 'react';

import { generateUrl } from '../../../../common/api/session';
import CopyTag from '../../../../common/components/copy-tag/CopyTag';
import useInfo from '../../../../common/hooks-query/useInfo';
import { isOntimeCloud, serverURL } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

/** MCP endpoint card — isolated so that URL state changes don't re-render the rest of FeaturePanel */
export default function McpSection() {
  const { data: infoData } = useInfo();
  const [mcpEndpointUrl, setMcpEndpointUrl] = useState('');

  useEffect(() => {
    const baseUrl = isOntimeCloud
      ? serverURL
      : infoData.networkInterfaces.length > 0
        ? `http://${infoData.networkInterfaces[0].address}:${infoData.serverPort}`
        : serverURL;

    generateUrl({ baseUrl, path: 'mcp', authenticate: true, lockConfig: false, lockNav: false })
      .then(setMcpEndpointUrl)
      .catch(() => {
        setMcpEndpointUrl('');
      });
  }, [infoData]);

  const mcpClientConfig = mcpEndpointUrl
    ? JSON.stringify({ mcpServers: { ontime: { url: mcpEndpointUrl } } }, null, 2)
    : '';

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>MCP Server</Panel.SubHeader>
        <Panel.Paragraph>Connect any MCP-compatible AI agent to Ontime using the endpoint below.</Panel.Paragraph>
        <Panel.Divider />
        <Panel.Field title='Endpoint URL' description='Add this URL to your MCP client settings' />
        {mcpEndpointUrl && <CopyTag copyValue={mcpEndpointUrl}>{mcpEndpointUrl}</CopyTag>}
        <Panel.Divider />
        <Panel.Field
          title='Client configuration snippet'
          description='Paste this into your AI agent settings under "mcpServers"'
        />
        {mcpEndpointUrl && <CopyTag copyValue={mcpClientConfig}>{mcpClientConfig}</CopyTag>}
      </Panel.Card>
    </Panel.Section>
  );
}
