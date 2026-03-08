import Info from '../../../../../common/components/info/Info';
import ExternalLink from '../../../../../common/components/link/external-link/ExternalLink';

const googleSheetDocsUrl = 'https://docs.getontime.no/features/import-spreadsheet-gsheet/';

export default function GSheetInfo() {
  return (
    <Info>
      Ontime can import data from spreadsheets by: <br />- importing the spreadsheet file in Ontime <br />-
      synchronising your project with a Google Sheet
      <br />
      <br />
      To synchronise with a Google Sheet, you will need to allow Ontime to authenticate with your Google account.
      <ExternalLink href={googleSheetDocsUrl}>See the docs</ExternalLink>
    </Info>
  );
}
