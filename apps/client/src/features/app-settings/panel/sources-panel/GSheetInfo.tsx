import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import { Alert } from '../../../../components/ui/alert';
const googleSheetDocsUrl = 'https://docs.getontime.no/features/import-spreadsheet-gsheet/';

export default function GSheetInfo() {
  return (
    <Alert
      status='info'
      variant='ontime-on-dark-info'
      title={
        <>
          {/* <AlertIcon /> */}
          Ontime allows you to synchronize your rundown with a Google Sheet.
          <br />
          <br />
          To enable this feature, you will need to generate tokens in your Google account and provide them to Ontime.
          <br />
          Once set up, you will be able to synchronize data between Ontime and your Google Sheet. <br />
          <ExternalLink href={googleSheetDocsUrl}>See the docs</ExternalLink>
        </>
      }
    />
  );
}
