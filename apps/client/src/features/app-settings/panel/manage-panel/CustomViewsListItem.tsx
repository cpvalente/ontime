import { IoDownloadOutline, IoOpenOutline, IoTrash } from 'react-icons/io5';

import { downloadCustomView } from '../../../../common/api/customViews';
import { maybeAxiosError } from '../../../../common/api/utils';
import IconButton from '../../../../common/components/buttons/IconButton';
import Switch from '../../../../common/components/switch/Switch';
import { handleLinks } from '../../../../common/utils/linkUtils';
import * as Panel from '../../panel-utils/PanelUtils';
import { getViewUrl } from './customViews.utils';

import style from './CustomViews.module.scss';

interface CustomViewsListItemProps {
  slug: string;
  displayInNav: boolean;
  index: number;
  onToggleDisplayInNav: (slug: string, displayInNav: boolean) => void;
  onDelete: (slug: string) => void;
  onError: (message: string) => void;
}

export default function CustomViewsListItem({
  slug,
  displayInNav,
  index,
  onToggleDisplayInNav,
  onDelete,
  onError,
}: CustomViewsListItemProps) {
  const handlePreview = () => {
    handleLinks(`external/${encodeURIComponent(slug)}/`);
  };

  const handleDownload = async () => {
    try {
      await downloadCustomView(slug);
    } catch (error) {
      onError(maybeAxiosError(error));
    }
  };

  return (
    <tr>
      <td>
        <Switch
          checked={displayInNav}
          onCheckedChange={(checked) => onToggleDisplayInNav(slug, checked)}
          aria-label='Show in nav'
          data-testid={`custom-view__nav_${index}`}
        />
      </td>
      <td>{slug}</td>
      <td className={style.urlCell}>{getViewUrl(slug)}</td>
      <td className={style.actionsCell}>
        <Panel.InlineElements relation='inner' align='end' className={style.actionsGroup}>
          <IconButton
            variant='ghosted-white'
            onClick={handlePreview}
            aria-label='Preview custom view'
            data-testid={`custom-view__preview_${index}`}
          >
            <IoOpenOutline />
          </IconButton>
          <IconButton
            variant='ghosted-white'
            onClick={handleDownload}
            aria-label='Download custom view'
            data-testid={`custom-view__download_${index}`}
          >
            <IoDownloadOutline />
          </IconButton>
          <IconButton
            variant='ghosted-destructive'
            onClick={() => onDelete(slug)}
            aria-label='Delete custom view'
            data-testid={`custom-view__delete_${index}`}
          >
            <IoTrash />
          </IconButton>
        </Panel.InlineElements>
      </td>
    </tr>
  );
}
