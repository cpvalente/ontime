import { useCallback, useMemo, useState } from 'react';
import { IconButton, Menu, MenuButton, MenuItem, MenuList, Switch } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';

import { deleteAlias, updateAliases } from '../../../../common/api/ontimeApi';

import UrlAliasForm, { UrlAliasFormValues } from './UrlAliasForm';

interface UrlAliasListItemProps {
  alias: string;
  enabled: boolean;
  pathAndParams: string;
  onRefetch: () => Promise<void>;
}

export default function UrlAliasListItem({ alias, enabled, pathAndParams, onRefetch }: UrlAliasListItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleToggle = useCallback(async () => {
    // TODO: Error handling
    await updateAliases({
      alias,
      enabled: !enabled,
      pathAndParams,
    });

    await onRefetch();
  }, [alias, enabled, onRefetch, pathAndParams]);

  const handleToggleEditMode = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const handleSubmitUpdate = useCallback(
    async (values: UrlAliasFormValues) => {
      try {
        await updateAliases(values);
        await onRefetch();
      } catch (error) {
        // some error handling here
      }
    },
    [onRefetch],
  );

  const handleDelete = useCallback(async () => {
    await deleteAlias(alias);
    await onRefetch();
  }, [alias, onRefetch]);

  const handleRenderAliases = useMemo(() => {
    if (!isEditing) {
      return (
        <>
          <td
            style={{
              width: '45%',
            }}
          >
            {alias}
          </td>
          <td
            style={{
              width: '45%',
            }}
          >
            {pathAndParams}
          </td>
          <td>
            <Switch variant='ontime-on-light' isChecked={enabled} onChange={handleToggle} />
          </td>
          <td>
            <ActionMenu onDelete={handleDelete} onChangeEditMode={handleToggleEditMode} />
          </td>
        </>
      );
    } else {
      return (
        <td colSpan={99}>
          <UrlAliasForm
            alias={alias}
            enabled={enabled}
            pathAndParams={pathAndParams}
            onCancel={handleToggleEditMode}
            onSubmit={handleSubmitUpdate}
            submitError=''
          />
        </td>
      );
    }
  }, [alias, enabled, handleDelete, handleSubmitUpdate, handleToggle, handleToggleEditMode, isEditing, pathAndParams]);

  return <tr key={alias}>{handleRenderAliases}</tr>;
}

function ActionMenu({ onChangeEditMode, onDelete }: { onChangeEditMode: () => void; onDelete: () => Promise<void> }) {
  const handleEdit = () => {
    onChangeEditMode();
  };

  return (
    <Menu variant='ontime-on-dark' size='sm'>
      <MenuButton
        as={IconButton}
        aria-label='Options'
        icon={<IoEllipsisHorizontal />}
        variant='ontime-ghosted'
        size='sm'
      />
      <MenuList>
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={onDelete}>Delete</MenuItem>
      </MenuList>
    </Menu>
  );
}
