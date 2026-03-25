import { CustomViewSummary } from 'ontime-types';
import { useState } from 'react';

import { deleteCustomView } from '../../../../common/api/customViews';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Dialog from '../../../../common/components/dialog/Dialog';
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
  const [targetSlug, setTargetSlug] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDelete = (slug: string) => {
    setTargetSlug(slug);
  };

  const submitDelete = async () => {
    if (!targetSlug) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteCustomView(targetSlug);
      onMutate();
    } catch (error) {
      onError(maybeAxiosError(error));
    } finally {
      setIsDeleting(false);
      setTargetSlug(null);
    }
  };

  return (
    <>
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
              onDelete={openDelete}
              onError={onError}
            />
          ))}
        </tbody>
      </Panel.Table>
      <Dialog
        isOpen={targetSlug !== null}
        onClose={() => setTargetSlug(null)}
        title='Delete custom view'
        showBackdrop
        showCloseButton
        bodyElements='You will permanently delete this file. Are you sure?'
        footerElements={
          <>
            <Button size='large' onClick={() => setTargetSlug(null)}>
              Cancel
            </Button>
            <Button variant='destructive' size='large' onClick={submitDelete} loading={isDeleting}>
              Delete custom view
            </Button>
          </>
        }
      />
    </>
  );
}
