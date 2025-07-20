import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { isOntimeCloud } from '../../../../externals';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import InfoNif from '../network-panel/NetworkInterfaces';

import GenerateLinkFormExport from './GenerateLinkFormExport';
import ReportSettings from './ReportSettings';
import URLPresets from './URLPresets';

export default function FeaturePanel({ location }: PanelBaseProps) {
  const presetsRef = useScrollIntoView<HTMLDivElement>('presets', location);
  const linkRef = useScrollIntoView<HTMLDivElement>('link', location);
  const reportRef = useScrollIntoView<HTMLDivElement>('report', location);

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
      <div ref={reportRef}>
        <ReportSettings />
      </div>
    </>
  );
}
