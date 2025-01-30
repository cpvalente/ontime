import { useCallback } from 'react';
import { Alert, AlertDescription, AlertIcon, Button } from '@chakra-ui/react';
import { IoTrashBin } from '@react-icons/all-files/io5/IoTrashBin';

import { deleteAllReport } from '../../../../common/api/report';
import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import useReport from '../../../../common/hooks-query/useReport';
import * as Panel from '../../panel-utils/PanelUtils';

const urlReport = 'https://docs.getontime.no/ontime/report';

export default function ReportSettings() {
  const { status } = useReport();

  const isLoading = status === 'pending';

  const clear = useCallback(async () => {
    console.log('cler')
    await deleteAllReport();
  }, []);

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Report</Panel.SubHeader>
        <Panel.Divider />
        <Alert status='info' variant='ontime-on-dark-info'>
          <AlertIcon />
          <AlertDescription>
            TODO: Explain something about report here
            <ExternalLink href={urlReport}>See the docs</ExternalLink>
          </AlertDescription>
        </Alert>
        <Panel.Section>
          <Panel.Loader isLoading={isLoading} />
          <Panel.Title>
            Manage reports
            <Button variant='ontime-subtle' rightIcon={<IoTrashBin />} size='sm' color='#FA5656' onClick={clear}>
              Clear All
            </Button>
          </Panel.Title>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
