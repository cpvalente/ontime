import useAliases from '../../../../common/hooks-query/useAliases';
import ModalLoader from '../../../modals/modal-loader/ModalLoader';
import * as Panel from '../PanelUtils';

import UrlPresetListItem from './UrlPresetListItem';

export default function UrlPresetList() {
  const { data, isFetching, refetch } = useAliases();

  const handleRefetch = async () => {
    await refetch();
  };

  if (isFetching) {
    return <ModalLoader />;
  }

  return (
    <Panel.Table>
      <thead>
        <tr>
          <th>Alias</th>
          <th>Path and Params</th>
          <th>Enabled</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {(data || []).map((alias) => {
          return (
            <UrlPresetListItem
              alias={alias.alias}
              enabled={alias.enabled}
              pathAndParams={alias.pathAndParams}
              onRefetch={handleRefetch}
              key={alias.alias}
            />
          );
        })}
      </tbody>
    </Panel.Table>
  );
}
