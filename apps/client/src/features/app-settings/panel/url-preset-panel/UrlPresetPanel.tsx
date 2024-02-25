import { useState } from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Button } from '@chakra-ui/react';

import ModalLink from '../../../modals/ModalLink';
import * as Panel from '../PanelUtils';

import UrlPresetList from './UrlPresetList';

import style from './UrlPresetPanel.module.scss';

const aliasesDocsUrl = 'https://ontime.gitbook.io/v2/features/url-aliases';

export default function UrlPresetPanel() {
  const [isCreatingPresetURL, setIsCreatingPresetURL] = useState(false);

  const handleToggleCreate = () => {
    setIsCreatingPresetURL((prev) => !prev);
  };

  return (
    <>
      <Panel.Header>URL Presets</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <main>
            <Alert status='info' variant='ontime-on-light-info'>
              <AlertIcon />
              <div className={style.column}>
                <AlertTitle>URL Presets</AlertTitle>
                <AlertDescription>
                  Custom presets allow providing a short name for any ontime URL. <br />
                  It serves two primary purposes: <br />
                  - Providing dynamic URLs for automation or unattended screens <br />- Simplifying complex URLs
                  <ModalLink href={aliasesDocsUrl}>For more information, see the docs</ModalLink>
                </AlertDescription>
              </div>
            </Alert>
            <div
              style={{
                marginTop: '1rem',
              }}
            >
              <Panel.SubHeader>
                Manage URL presets
                <Button variant='ontime-filled' onClick={handleToggleCreate}>
                  New
                </Button>
              </Panel.SubHeader>
            </div>
            <UrlPresetList isCreatingPresetURL={isCreatingPresetURL} onToggleCreate={handleToggleCreate} />
          </main>
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
