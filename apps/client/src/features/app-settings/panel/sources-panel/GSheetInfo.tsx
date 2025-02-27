import Info from '../../../../common/components/info/Info';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';

const googleSheetDocsUrl = 'https://docs.getontime.no/features/import-spreadsheet-gsheet/';

export default function GSheetInfo() {
  return (
    <Info>
      Ontime allows you to synchronize your rundown with a Google Sheet.
      <br />
      <br />
      To enable this feature, you will need to generate tokens in your Google account and provide them to Ontime.
      <br />
      Once set up, you will be able to synchronize data between Ontime and your Google Sheet. <br />
      <ExternalLink href={googleSheetDocsUrl}>See the docs</ExternalLink>
    </Info>
  );
}
