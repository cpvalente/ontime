import { useEffect, useState } from 'react';

import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { generateUrl } from '../../../../common/api/session';
import CopyTag from '../../../../common/components/copy-tag/CopyTag';
import useInfo from '../../../../common/hooks-query/useInfo';
import { isOntimeCloud, serverURL } from '../../../../externals';
import GenerateLinkFormExport from '../../../sharing/GenerateLinkFormExport';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import InfoNif from '../network-panel/NetworkInterfaces';
import ReportSettings from './ReportSettings';
import URLPresets from './URLPresets';

export default function FeaturePanel({ location }: PanelBaseProps) {
  const presetsRef = useScrollIntoView<HTMLDivElement>('presets', location);
  const linkRef = useScrollIntoView<HTMLDivElement>('link', location);
  const reportRef = useScrollIntoView<HTMLDivElement>('report', location);
  const mcpRef = useScrollIntoView<HTMLDivElement>('mcp', location);

  const { data: infoData } = useInfo();
  const [mcpEndpointUrl, setMcpEndpointUrl] = useState('');

  useEffect(() => {
    const baseUrl = isOntimeCloud
      ? serverURL
      : infoData.networkInterfaces.length > 0
        ? `http://${infoData.networkInterfaces[0].address}:${infoData.serverPort}`
        : serverURL;

    generateUrl({ baseUrl, path: '/mcp', authenticate: true, lockConfig: false, lockNav: false })
      .then(setMcpEndpointUrl)
      .catch(() => {
        setMcpEndpointUrl(`${baseUrl}/mcp`);
      });
  }, [infoData]);

  const claudeDesktopConfig = JSON.stringify(
    { mcpServers: { ontime: { url: mcpEndpointUrl } } },
    null,
    2,
  );

  return (
    <>
      <Panel.Header>Sharing and reporting</Panel.Header>
      <div ref={presetsRef}>
        <URLPresets />
      </div>
      <div ref={linkRef}>
        <Panel.Section>
          <Panel.Card>
            <Panel.SubHeader>Share Ontime Link</Panel.SubHeader>
            {!isOntimeCloud && (
              <>
                <Panel.Paragraph>Ontime is streaming on the following network interfaces</Panel.Paragraph>
                <InfoNif />
              </>
            )}
            <Panel.Divider />
            <GenerateLinkFormExport />
          </Panel.Card>
        </Panel.Section>
      </div>
      <div ref={mcpRef}>
        <Panel.Section>
          <Panel.Card>
            <Panel.SubHeader>MCP Server (AI Agent Integration)</Panel.SubHeader>
            <Panel.Paragraph>
              Connect AI agents (e.g. Claude Desktop) to Ontime via the Model Context Protocol endpoint.
            </Panel.Paragraph>
            <Panel.Divider />
            <Panel.Field
              title='MCP Endpoint URL'
              description='Use this URL in your MCP client configuration'
            />
            {mcpEndpointUrl && (
              <CopyTag copyValue={mcpEndpointUrl}>{mcpEndpointUrl}</CopyTag>
            )}
            <Panel.Divider />
            <Panel.Field
              title='Claude Desktop config'
              description='Paste this into your claude_desktop_config.json under "mcpServers"'
            />
            {mcpEndpointUrl && (
              <CopyTag copyValue={claudeDesktopConfig}>{claudeDesktopConfig}</CopyTag>
            )}
          </Panel.Card>
        </Panel.Section>
      </div>
      <div ref={reportRef}>
        <ReportSettings />
      </div>
    </>
  );
}
