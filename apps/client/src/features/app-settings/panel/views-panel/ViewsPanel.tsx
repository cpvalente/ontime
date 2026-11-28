import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import CustomViews from './CustomViews';
import TeleprompterSettings from './TeleprompterSettings';
import ViewSettings from './ViewSettings';

export default function ViewsPanel({ location }: PanelBaseProps) {
  const viewRef = useScrollIntoView<HTMLDivElement>('view', location);
  const teleprompterRef = useScrollIntoView<HTMLDivElement>('teleprompter', location);
  const customViewsRef = useScrollIntoView<HTMLDivElement>('custom-views', location);

  return (
    <>
      <Panel.Header>Views</Panel.Header>
      <div ref={viewRef}>
        <ViewSettings />
      </div>
      <div ref={customViewsRef}>
        <CustomViews />
      </div>
      <div ref={teleprompterRef}>
        <TeleprompterSettings />
      </div>
    </>
  );
}
