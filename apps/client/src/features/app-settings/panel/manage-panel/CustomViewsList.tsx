import { CustomViewSummary } from 'ontime-types';

import * as Panel from '../../panel-utils/PanelUtils';
import CustomViewsListItem from './CustomViewsListItem';

import style from './CustomViews.module.scss';

interface CustomViewsListProps {
  views: CustomViewSummary[];
  onOpenUpload: () => void;
  onMutate: () => void;
  onError: (message: string) => void;
}

export default function CustomViewsList({ views, onOpenUpload, onMutate, onError }: CustomViewsListProps) {
  return (
    <Panel.Table>
      <thead>
        <tr>
          <th>Name</th>
          <th>URL</th>
          <th className={style.actionsHeader} />
        </tr>
      </thead>
      <tbody>
        {views.length === 0 && <Panel.TableEmpty handleClick={onOpenUpload} label='No custom views yet' />}
        {views.map((view, index) => (
          <CustomViewsListItem
            key={view.slug}
            slug={view.slug}
            index={index}
            onMutate={onMutate}
            onError={onError}
          />
        ))}
      </tbody>
    </Panel.Table>
  );
}
