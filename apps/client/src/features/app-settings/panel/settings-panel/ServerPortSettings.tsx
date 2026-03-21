import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import Tag from '../../../../common/components/tag/Tag';
import useServerPort from '../../../../common/hooks-query/useServerPort';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { isOnlyNumbers } from '../../../../common/utils/regex';
import * as Panel from '../../panel-utils/PanelUtils';

interface ServerPortForm {
  serverPort: number;
}

export default function ServerPortSettings() {
  const { data, status, isError, refetch, mutateAsync } = useServerPort();
  const {
    handleSubmit,
    register,
    reset,
    setError,
    clearErrors,
    formState: { isSubmitting, isDirty, isValid, errors },
  } = useForm<ServerPortForm>({
    mode: 'onChange',
    defaultValues: { serverPort: 4001 },
  });

  useEffect(() => {
    reset({ serverPort: data.port });
  }, [data.pendingRestart, data.port, reset]);

  const onSubmit = async (formData: ServerPortForm) => {
    if (formData.serverPort < 1024 || formData.serverPort > 65535) {
      setError('serverPort', { message: 'Port must be within range 1024 - 65535' });
      return;
    }
    try {
      clearErrors('root');
      await mutateAsync(formData.serverPort);
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    }
  };

  const onReset = async () => {
    clearErrors('root');
    const result = await refetch();

    if (result.isError) {
      setError('root', { message: 'Failed to load server port' });
      return;
    }

    reset({ serverPort: result.data?.port ?? data.port });
  };

  const rootError = isError ? 'Failed to load server port' : errors.root?.message;

  return (
    <Panel.Section
      as='form'
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => preventEscape(event, onReset)}
      id='server-port-settings'
    >
      <Panel.Card>
        <Panel.SubHeader>
          Server port
          <Panel.InlineElements>
            {data.pendingRestart && <Tag>A port change is pending and will happen on the next restart</Tag>}
            <Button disabled={!isDirty || isSubmitting} variant='ghosted' onClick={onReset}>
              Revert to saved
            </Button>
            <Button
              type='submit'
              form='server-port-settings'
              name='server-port-settings-submit'
              loading={isSubmitting}
              disabled={!isDirty || !isValid || isSubmitting}
              variant='primary'
            >
              Save
            </Button>
          </Panel.InlineElements>
        </Panel.SubHeader>
        <Panel.Loader isLoading={status === 'pending'} />
        {rootError && <Panel.Error>{rootError}</Panel.Error>}
        <Panel.Divider />
        <Panel.Section>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Ontime server port'
                description='Port ontime server listens in. Defaults to 4001 (needs app restart)'
                error={errors.serverPort?.message}
              />
              <Input
                id='serverPort'
                type='number'
                maxLength={5}
                style={{ width: '75px' }}
                {...register('serverPort', {
                  required: { value: true, message: 'Required field' },
                  max: { value: 65535, message: 'Port must be within range 1024 - 65535' },
                  min: { value: 1024, message: 'Port must be within range 1024 - 65535' },
                  pattern: {
                    value: isOnlyNumbers,
                    message: 'Value should be numeric',
                  },
                })}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
