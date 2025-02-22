import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';

import CustomFields from './custom-fields/CustomFields';
import ReportSettings from './ReportSettings';
import UrlPresetsForm from './UrlPresetsForm';

export default function FeatureSettingsPanel({ location }: PanelBaseProps) {
  const customFieldsRef = useScrollIntoView<HTMLDivElement>('custom', location);
  const urlPresetsRef = useScrollIntoView<HTMLDivElement>('urlpresets', location);
  const reportRef = useScrollIntoView<HTMLDivElement>('report', location);

  return (
    <>
      <Panel.Header>Feature Settings</Panel.Header>
      <div ref={customFieldsRef}>
        <CustomFields />
      </div>

      <div ref={urlPresetsRef}>
        <UrlPresetsForm />
      </div>

      <div ref={reportRef}>
        <ReportSettings />
      </div>
    </>
  );
}
