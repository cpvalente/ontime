import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Switch } from '@chakra-ui/react';
import { IoLogoGoogle } from '@react-icons/all-files/io5/IoLogoGoogle';
import { TokenResponse, useGoogleLogin } from '@react-oauth/google';
import { SyncSettings } from 'ontime-types';

import { logAxiosError } from '../../../common/api/apiUtils';
import { postGoogleJwt, postSyncSettings } from '../../../common/api/ontimeApi';
import useSyncSettings from '../../../common/hooks-query/useSyncSettings';
import ModalLoader from '../modal-loader/ModalLoader';
import { inputProps } from '../modalHelper';
import ModalSplitInput from '../ModalSplitInput';
import OntimeModalFooter from '../OntimeModalFooter';

import style from './SettingsModal.module.scss';

export default function SyncForm() {
  // if not already added, add google identity api scrpt to the page

  const { data, status, refetch, isFetching } = useSyncSettings();
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty, isValid, dirtyFields },
  } = useForm<SyncSettings>({
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

  const onSubmit = async (formData: SyncSettings) => {
    try {
      await postSyncSettings(formData);
    } catch (error) {
      logAxiosError('Error saving sync settings', error);
    } finally {
      await refetch();
    }
  };

  const onGoogleSignInResponse = async (data: TokenResponse) => {
    console.log(data);
    await postGoogleJwt(data.access_token);
  };

  const loginViaGoogle = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/spreadsheets ',
    onSuccess: onGoogleSignInResponse,
  });

  const login = () => {
    // is Electron user agent
    if (navigator.userAgent.includes('Electron') || ['localhost', '127.0.0.1'].includes(location.hostname)) {
      loginViaGoogle();
    } else {
      const url = new URL('http://127.0.0.1:8082');
      url.searchParams.append(
        'ontimeUrl',
        `${`${location.protocol}//${
          import.meta.env.DEV ? location.host.replace('3000', '4001') : location.host
        }/ontime/google-jwt`}`,
      );
      window.location.href = url.toString();
    }
  };

  const onReset = () => {
    reset(data);
  };

  if (!control) {
    return null;
  }

  if (isFetching) {
    return <ModalLoader />;
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} id='view-settings' className={style.sectionContainer}>
      <span className={style.title}>Google Sheets</span>
      <ModalSplitInput
        field='googleSheetsEnabled'
        title='Enable Google Sheets Synchonization'
        description='Enable synchronization with Google Sheets. This will allow you to edit your cuesheets in Google Sheets and have them automatically synchronized with Ontime.'
      >
        <Switch {...register('googleSheetsEnabled')} variant='ontime-on-light' />
      </ModalSplitInput>
      <ModalSplitInput field='googleSheetId' title='Google Sheet ID' description=''>
        <Input
          {...inputProps}
          width='300px'
          variant='ontime-filled-on-light'
          placeholder='Retrieve it from the URL when viewing a Sheet'
          isDisabled={isSubmitting || !data?.googleSheetsEnabled}
          {...register('googleSheetId')}
        />
      </ModalSplitInput>
      <ModalSplitInput description='' field='' title='Login'>
        <Button
          variant='ontime-filled'
          onClick={login}
          style={{ width: '300px' }}
          isDisabled={isSubmitting || !data?.googleSheetsEnabled}
        >
          <IoLogoGoogle style={{ marginInlineStart: 5, marginInlineEnd: 5 }} /> Login and Sync
        </Button>
      </ModalSplitInput>
      <OntimeModalFooter
        formId='view-settings'
        handleRevert={onReset}
        isDirty={isDirty}
        isValid={isValid}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
