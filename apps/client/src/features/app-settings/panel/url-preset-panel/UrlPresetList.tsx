import { postAlias } from '../../../../common/api/ontimeApi';
import useAliases from '../../../../common/hooks-query/useAliases';
import ModalLoader from '../../../modals/modal-loader/ModalLoader';
import * as Panel from '../PanelUtils';

import UrlPresetForm, { UrlPresetFormValues } from './UrlPresetForm';
import UrlPresetListItem from './UrlPresetListItem';

interface UrlPresetListProps {
  isCreatingPresetURL: boolean;
  onToggleCreate: () => void;
}

export default function UrlPresetList({ isCreatingPresetURL, onToggleCreate }: UrlPresetListProps) {
  const { data, isFetching, refetch } = useAliases();

  const handleRefetch = async () => {
    await refetch();
  };

  const handleSubmitCreate = async (values: UrlPresetFormValues) => {
    try {
      // TODO: fix this
      // @ts-ignore
      await postAlias({
        ...values,
        enabled: true,
      });
      await refetch();
    } catch (error) {
      // some error handling here
    }
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
        {isCreatingPresetURL ? (
          <tr>
            <td colSpan={99}>
              <UrlPresetForm onCancel={onToggleCreate} onSubmit={handleSubmitCreate} submitError='' />
              {/* {submitError && <span className={style.createSubmitError}>{submitError}</span>} */}
            </td>
          </tr>
        ) : null}
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
