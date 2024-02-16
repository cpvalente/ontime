import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';

import ModalLink from '../../../../features/modals/ModalLink';
import * as Panel from '../PanelUtils';

import UrlAliasList from './UrlAliasList';

import style from './UrlAliasPanel.module.scss';

const aliasesDocsUrl = 'https://ontime.gitbook.io/v2/features/url-aliases';

export default function UrlAliasPanel() {
  return (
    <>
      <Panel.Header>URL Aliases</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <div>
            <Alert status='info' variant='ontime-on-light-info'>
              <AlertIcon />
              <div className={style.column}>
                <AlertTitle>URL Aliases</AlertTitle>
                <AlertDescription>
                  Custom aliases allow providing a short name for any ontime URL. <br />
                  It serves two primary purposes: <br />
                  - Providing dynamic URLs for automation or unattended screens <br />- Simplifying complex URLs
                  <ModalLink href={aliasesDocsUrl}>For more information, see the docs</ModalLink>
                </AlertDescription>
              </div>
            </Alert>
            <UrlAliasList />
          </div>
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
