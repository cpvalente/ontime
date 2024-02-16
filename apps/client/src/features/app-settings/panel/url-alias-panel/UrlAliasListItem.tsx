import { IconButton, Menu, MenuButton, MenuItem, MenuList, Switch } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';

export type EditMode = 'rename' | 'duplicate' | null;

interface UrlAliasListItemProps {
  alias: string;
  enabled: boolean;
  pathAndParams: string;
  // onToggleEditMode: (editMode: EditMode, filename: string | null) => void;
  // onSubmit: () => void;
  // onRefetch: () => Promise<void>;
  // editingFilename: string | null;
  // editingMode: EditMode | null;
}

export default function UrlAliasListItem({ alias, enabled, pathAndParams }: UrlAliasListItemProps) {
  // const [submitError, setSubmitError] = useState<string | null>(null);

  // const handleSubmitRename = async (values: ProjectFormValues) => {
  //   try {
  //     setSubmitError(null);

  //     if (!values.filename) {
  //       setSubmitError('Filename cannot be blank');
  //       return;
  //     }
  //     await renameProject(filename, values.filename);
  //     await onRefetch();
  //     onSubmit();
  //   } catch (error) {
  //     setSubmitError(maybeAxiosError(error));
  //   }
  // };

  // const handleSubmitDuplicate = async (values: ProjectFormValues) => {
  //   try {
  //     setSubmitError(null);

  //     if (!values.filename) {
  //       setSubmitError('Filename cannot be blank');
  //       return;
  //     }
  //     await duplicateProject(filename, values.filename);
  //     await onRefetch();
  //     onSubmit();
  //   } catch (error) {
  //     setSubmitError(maybeAxiosError(error));
  //   }
  // };

  // const handleToggleEditMode = (editMode: EditMode, filename: string | null) => {
  //   setSubmitError(null);
  //   onToggleEditMode(editMode, filename);
  // };

  return (
    <tr key={alias}>
      <td>{alias}</td>
      <td>{pathAndParams}</td>
      <td>
        <Switch
          variant='ontime-on-light'
          defaultValue={enabled}
          // isDisabled={disableInputs}
        />
      </td>
      <td>
        <ActionMenu />
      </td>
      {/* <td>{new Date(updatedAt).toLocaleString()}</td>
      <td className={style.actionButton}></td> */}
    </tr>
  );
}

function ActionMenu() {
  const handleRename = () => {
    // onChangeEditMode('rename', filename);
  };

  const handleDelete = async () => {
    // await deleteProject();
    // await onRefetch();
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
        <MenuItem onClick={handleRename}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </MenuList>
    </Menu>
  );
}
