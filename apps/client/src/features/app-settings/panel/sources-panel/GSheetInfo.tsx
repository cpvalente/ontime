import { Alert } from '@mantine/core';

import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import { IoAlertCircleOutline } from '@react-icons/all-files/io5/IoAlertCircleOutline';
const googleSheetDocsUrl = 'https://docs.getontime.no/features/import-spreadsheet-gsheet/';

export default function GSheetInfo() {
  return (
    <Alert color='blue' icon={<IoAlertCircleOutline />} variant='ontime-on-dark-info'>
      Ontime allows you to synchronize your rundown with a Google Sheet.
      <br />
      <br />
      To enable this feature, you will need to generate tokens in your Google account and provide them to Ontime.
      <br />
      Once set up, you will be able to synchronize data between Ontime and your Google Sheet. <br />
      <ExternalLink href={googleSheetDocsUrl}>See the docs</ExternalLink>
    </Alert>
  );
}
