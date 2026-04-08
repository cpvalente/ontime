import { appVersion } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

export default function AppVersion() {
  return <Panel.Paragraph>{`You are currently using Ontime version ${appVersion}.`}</Panel.Paragraph>;
}
