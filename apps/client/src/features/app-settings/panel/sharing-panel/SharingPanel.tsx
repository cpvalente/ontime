import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import AccessSettings from './AccessSettings';
import ShareLink from './ShareLink';
import URLPresets from './URLPresets';

export default function SharingPanel({ location }: PanelBaseProps) {
  const presetsRef = useScrollIntoView<HTMLDivElement>('presets', location);
  const linkRef = useScrollIntoView<HTMLDivElement>('link', location);
  const accessRef = useScrollIntoView<HTMLDivElement>('access', location);

  return (
    <>
      <Panel.Header>Sharing and access</Panel.Header>
      <div ref={presetsRef}>
        <URLPresets />
      </div>
      <div ref={linkRef}>
        <ShareLink />
      </div>
      <div ref={accessRef}>
        <AccessSettings />
      </div>
    </>
  );
}
