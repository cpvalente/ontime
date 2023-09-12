import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Switch } from '@chakra-ui/react';
import { CredentialResponse, TokenResponse, useGoogleLogin } from '@react-oauth/google';
import { ViewSettings } from 'ontime-types';

import { logAxiosError } from '../../../common/api/apiUtils';
import { postGoogleJwt, postViewSettings } from '../../../common/api/ontimeApi';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { mtm } from '../../../common/utils/timeConstants';
import ModalLoader from '../modal-loader/ModalLoader';
import ModalSplitInput from '../ModalSplitInput';
import OntimeModalFooter from '../OntimeModalFooter';

import style from './SettingsModal.module.scss';

export default function SyncForm() {
  // if not already added, add google identity api scrpt to the page

  const { data, status, refetch, isFetching } = useViewSettings();
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty, isValid, dirtyFields },
  } = useForm<ViewSettings>({
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

  const onSubmit = async (formData: ViewSettings) => {
    const parsedWarningThreshold = dirtyFields?.warningThreshold
      ? // @ts-expect-error -- trust me
        Number.parseInt(formData.warningThreshold) * mtm
      : formData.warningThreshold;
    const parsedDangerThreshold = dirtyFields?.dangerThreshold
      ? // @ts-expect-error -- trust me
        Number.parseInt(formData.dangerThreshold) * mtm
      : formData.dangerThreshold;

    const newData = {
      ...formData,
      warningThreshold: parsedWarningThreshold,
      dangerThreshold: parsedDangerThreshold,
    };

    try {
      await postViewSettings(newData);
    } catch (error) {
      logAxiosError('Error saving view settings', error);
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
    if (navigator.userAgent.includes('Electron')) {
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
        <Switch {...register('overrideStyles')} variant='ontime-on-light' />
      </ModalSplitInput>
      <button onClick={login}>Login</button>
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
