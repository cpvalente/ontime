import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Input } from '@chakra-ui/react';
import { UserFields } from 'ontime-types';

import { logAxiosError } from '../../../common/api/apiUtils';
import { postUserFields } from '../../../common/api/ontimeApi';
import useUserFields from '../../../common/hooks-query/useUserFields';
import ModalLoader from '../modal-loader/ModalLoader';
import { inputProps } from '../modalHelper';
import ModalLink from '../ModalLink';
import ModalSplitInput from '../ModalSplitInput';
import OntimeModalFooter from '../OntimeModalFooter';

import style from './SettingsModal.module.scss';

const userFieldsDocsUrl = 'https://ontime.gitbook.io/v2/features/user-fields';

export default function CuesheetSettingsForm() {
  const { data, status, isFetching, refetch } = useUserFields();
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<UserFields>({
    defaultValues: data,
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  const onSubmit = async (formData: UserFields) => {
    try {
      await postUserFields(formData);
    } catch (error) {
      logAxiosError('Error saving cuesheet settings', error);
    } finally {
      await refetch();
    }
  };

  const onReset = () => {
    reset(data);
  };

  const disableInputs = status === 'pending';

  if (isFetching) {
    return <ModalLoader />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} id='cuesheet-settings' className={style.sectionContainer}>
      <div style={{ height: '16px' }} />
      <Alert status='info' variant='ontime-on-light-info'>
        <AlertIcon />
        <div className={style.column}>
          <AlertTitle>User Fields</AlertTitle>
          <AlertDescription>
            Allow for custom naming of additional data fields on each event (eg. light, sound, camera). <br />
            <ModalLink href={userFieldsDocsUrl}>See the docs</ModalLink>
          </AlertDescription>
        </div>
      </Alert>
      <div style={{ height: '16px' }} />
      <ModalSplitInput field='user0' title='User0' description='' error={errors.user0?.message}>
        <Input
          {...inputProps}
          width='300px'
          variant='ontime-filled-on-light'
          isDisabled={disableInputs}
          placeholder='Display name for user field'
          {...register('user0')}
        />
      </ModalSplitInput>
      <ModalSplitInput field='user1' title='User1' description='' error={errors.user1?.message}>
        <Input
          {...inputProps}
          width='300px'
          variant='ontime-filled-on-light'
          isDisabled={disableInputs}
          placeholder='Display name for user field'
          {...register('user1')}
        />
      </ModalSplitInput>
      <ModalSplitInput field='user2' title='User2' description='' error={errors.user2?.message}>
        <Input
          {...inputProps}
          width='300px'
          variant='ontime-filled-on-light'
          isDisabled={disableInputs}
          placeholder='Display name for user field'
          {...register('user2')}
        />
      </ModalSplitInput>
      <ModalSplitInput field='user3' title='User3' description='' error={errors.user3?.message}>
        <Input
          {...inputProps}
          width='300px'
          variant='ontime-filled-on-light'
          isDisabled={disableInputs}
          placeholder='Display name for user field'
          {...register('user3')}
        />
      </ModalSplitInput>
      <ModalSplitInput field='user4' title='User4' description='' error={errors.user4?.message}>
        <Input
          {...inputProps}
          width='300px'
          variant='ontime-filled-on-light'
          isDisabled={disableInputs}
          placeholder='Display name for user field'
          {...register('user4')}
        />
      </ModalSplitInput>
      <ModalSplitInput field='user5' title='User5' description='' error={errors.user5?.message}>
        <Input
          {...inputProps}
          width='300px'
          variant='ontime-filled-on-light'
          isDisabled={disableInputs}
          placeholder='Display name for user field'
          {...register('user5')}
        />
      </ModalSplitInput>
      <ModalSplitInput field='user6' title='User6' description='' error={errors.user6?.message}>
        <Input
          {...inputProps}
          width='300px'
          variant='ontime-filled-on-light'
          isDisabled={disableInputs}
          placeholder='Display name for user field'
          {...register('user6')}
        />
      </ModalSplitInput>
      <ModalSplitInput field='user7' title='User7' description='' error={errors.user7?.message}>
        <Input
          {...inputProps}
          width='300px'
          variant='ontime-filled-on-light'
          isDisabled={disableInputs}
          placeholder='Display name for user field'
          {...register('user7')}
        />
      </ModalSplitInput>
      <ModalSplitInput field='user8' title='User8' description='' error={errors.user8?.message}>
        <Input
          {...inputProps}
          width='300px'
          variant='ontime-filled-on-light'
          isDisabled={disableInputs}
          placeholder='Display name for user field'
          {...register('user8')}
        />
      </ModalSplitInput>
      <ModalSplitInput field='user9' title='User9' description='' error={errors.user9?.message}>
        <Input
          {...inputProps}
          width='300px'
          variant='ontime-filled-on-light'
          isDisabled={disableInputs}
          placeholder='Display name for user field'
          {...register('user9')}
        />
      </ModalSplitInput>
      <OntimeModalFooter
        formId='cuesheet-settings'
        handleRevert={onReset}
        isDirty={isDirty}
        isValid={isValid}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
