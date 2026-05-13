import { useState } from 'react';
import { IoAdd } from 'react-icons/io5';

import { restoreDemoView } from '../../../../common/api/customViews';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import useCustomViews from '../../../../common/hooks-query/useCustomViews';
import * as Panel from '../../panel-utils/PanelUtils';
import CustomViewForm from './CustomViewForm';
import { customViewsDocs } from './customViews.utils';
import CustomViewsList from './CustomViewsList';

export default function CustomViews() {
  const { data, refetch, status } = useCustomViews();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasDemoView = data.views.some((view) => view.slug === 'demo');

  const handleUploadComplete = async () => {
    setIsUploadOpen(false);
    await refetch();
  };

  const handleRestoreDemo = async () => {
    try {
      setActionError(null);
      await restoreDemoView();
      await refetch();
    } catch (error) {
      setActionError(maybeAxiosError(error));
    }
  };

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>
          Custom views
          <Panel.InlineElements>
            <Button variant='ghosted' onClick={handleRestoreDemo} disabled={hasDemoView}>
              Restore demo
            </Button>
            <Button onClick={() => setIsUploadOpen(true)} disabled={isUploadOpen}>
              New <IoAdd />
            </Button>
          </Panel.InlineElements>
        </Panel.SubHeader>
        <Panel.Divider />

        <Panel.Section>
          <Info>
            <span>
              Upload one <strong>index.html</strong> per view to <strong>/external/&lt;name&gt;/</strong>.
            </span>
            External imports are not allowed, include all assets inside the html file.
            <ExternalLink href={customViewsDocs}>See the docs</ExternalLink>
          </Info>
        </Panel.Section>

        <Panel.Section>
          <Panel.Loader isLoading={status === 'pending'} />

          {isUploadOpen && <CustomViewForm onComplete={handleUploadComplete} onClose={() => setIsUploadOpen(false)} />}

          {actionError && <Panel.Error>{actionError}</Panel.Error>}

          <CustomViewsList
            views={data.views}
            onOpenUpload={() => setIsUploadOpen(true)}
            onMutate={() => refetch()}
            onError={setActionError}
          />
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
