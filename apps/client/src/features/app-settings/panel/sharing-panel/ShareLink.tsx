import { preventEscape } from '../../../../common/utils/keyEvent';
import { capabilities } from '../../../../externals';
import GenerateLinkFormExport from '../../../sharing/GenerateLinkFormExport';
import * as Panel from '../../panel-utils/PanelUtils';
import InfoNif from './NetworkInterfaces';

export default function ShareLink() {
  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Share</Panel.SubHeader>
        {capabilities.canListNetworkInterfaces && (
          <>
            <Panel.Paragraph>Ontime is streaming on the following network interfaces</Panel.Paragraph>
            <InfoNif />
          </>
        )}
        <Panel.Divider />
        <div onKeyDown={(event) => preventEscape(event)}>
          <GenerateLinkFormExport />
        </div>
      </Panel.Card>
    </Panel.Section>
  );
}
