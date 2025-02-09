import { useCallback } from 'react';
import { Button } from '@chakra-ui/react';
import { IoTrashBin } from '@react-icons/all-files/io5/IoTrashBin';

import { deleteAllReport } from '../../../../common/api/report';
import useReport from '../../../../common/hooks-query/useReport';
import * as Panel from '../../panel-utils/PanelUtils';

export default function ReportSettings() {
  const { data } = useReport();
  const enableClearReport = Object.keys(data).length <= 0;
  const clear = useCallback(async () => {
    await deleteAllReport();
  }, []);

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Report</Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Panel.Title>
            Manage reports
            <Button
              variant='ontime-subtle'
              rightIcon={<IoTrashBin />}
              size='sm'
              color='#FA5656'
              onClick={clear}
              isDisabled={enableClearReport}
            >
              Clear All
            </Button>
          </Panel.Title>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
