import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, IconButton, Input, Switch } from '@chakra-ui/react';
import { IoOpenOutline } from '@react-icons/all-files/io5/IoOpenOutline';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import { Alias } from 'ontime-types';

import { logAxiosError } from '../../../common/api/apiUtils';
import { postAliases } from '../../../common/api/ontimeApi';
import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import useAliases from '../../../common/hooks-query/useAliases';
import { useEmitLog } from '../../../common/stores/logger';
import { handleLinks } from '../../../common/utils/linkUtils';
import ModalLoader from '../modal-loader/ModalLoader';
import { inputProps } from '../modalHelper';
import ModalLink from '../ModalLink';
import OntimeModalFooter from '../OntimeModalFooter';

import style from './SettingsModal.module.scss';

const aliasesDocsUrl = 'https://ontime.gitbook.io/v2/features/url-aliases';

// we wrap the array in an object to be simplify react-hook-form
type Aliases = {
  aliases: Alias[];
};

export default function AliasesForm() {
  const { data, status, isFetching, refetch } = useAliases();
  const { emitError } = useEmitLog();
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty, isValid },
  } = useForm<Aliases>({
    defaultValues: { aliases: data },
    values: { aliases: data || [] },
    resetOptions: {
      keepDirtyValues: true,
    },
  });
  const { fields, append, remove } = useFieldArray({
    name: 'aliases',
    control,
  });

  useEffect(() => {
    if (data) {
      reset({ aliases: data });
    }
  }, [data, reset]);

  const onSubmit = async (formData: Aliases) => {
    try {
      await postAliases(formData.aliases);
    } catch (error) {
      logAxiosError('Error saving aliases', error);
    } finally {
      await refetch();
    }
  };

  const onReset = () => {
    reset({ aliases: data });
  };

  const addNew = () => {
    if (fields.length > 20) {
      emitError('Maximum amount of aliases reached (20)');
      return;
    }
    append({
      enabled: false,
      alias: '',
      pathAndParams: '',
    });
  };

  const disableInputs = status === 'pending';
  const hasTooManyOptions = fields.length >= 20;

  if (isFetching) {
    return <ModalLoader />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} id='aliases' className={style.sectionContainer}>
      <div style={{ height: '16px' }} />
      <Alert status='info' variant='ontime-on-light-info'>
        <AlertIcon />
        <div className={style.column}>
          <AlertTitle>URL Aliases</AlertTitle>
          <AlertDescription>
            Custom aliases allow providing a short name for any ontime URL. <br />
            It serves two primary purposes: <br />
            - Providing dynamic URLs for automation or unattended screens <br />- Simplifying complex URLs
            <ModalLink href={aliasesDocsUrl}>For more information, see the docs</ModalLink>
          </AlertDescription>
        </div>
      </Alert>
      <div style={{ height: '16px' }} />
      <ul className={style.aliases}>
        {fields.map((alias, index) => {
          return (
            <li className={style.aliasRow} key={alias.id}>
              <IconButton
                onClick={() => remove(index)}
                aria-label='delete'
                size='xs'
                icon={<IoRemove />}
                colorScheme='red'
                isDisabled={disableInputs}
                data-testid={`field__delete_${index}`}
              />
              <Input
                {...inputProps}
                {...register(`aliases.${index}.alias`)}
                width='12em'
                size='xs'
                variant='ontime-filled-on-light'
                placeholder='URL Alias'
                isDisabled={disableInputs}
                data-testid={`field__alias_${index}`}
              />
              <Input
                {...inputProps}
                {...register(`aliases.${index}.pathAndParams`)}
                className={style.grow}
                size='xs'
                variant='ontime-filled-on-light'
                placeholder='URL (portion after ontime Port)'
                isDisabled={disableInputs}
                data-testid={`field__url_${index}`}
              />
              <TooltipActionBtn
                clickHandler={(event) => handleLinks(event, alias.alias)}
                tooltip='Test alias'
                aria-label='Test alias'
                size='xs'
                variant='ontime-ghost-on-light'
                icon={<IoOpenOutline />}
                colorScheme='red'
                isDisabled={disableInputs}
                data-testid={`field__test_${index}`}
              />
              <Switch
                {...register(`aliases.${index}.enabled`)}
                variant='ontime-on-light'
                isDisabled={disableInputs}
                data-testid={`field__enable_${index}`}
              />
            </li>
          );
        })}
      </ul>
      <Button
        onClick={addNew}
        className={style.shiftRight}
        isDisabled={hasTooManyOptions}
        size='xs'
        colorScheme='blue'
        variant='outline'
        padding='0 2em'
      >
        Add new
      </Button>
      <OntimeModalFooter
        formId='aliases'
        handleRevert={onReset}
        isDirty={isDirty}
        isValid={isValid}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
