import { useForm } from 'react-hook-form';
import { SyncHostConnectionRequest, SyncRoll } from 'ontime-types';

import { connectToHost } from '../../../../common/api/sync';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import Select from '../../../../common/components/select/Select';
import { useSync } from '../../../../common/hooks-query/useSync';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

export default function Sync() {
  const { list, refetch, isLoading } = useSync();
  const {
    handleSubmit,
    register,
    reset,
    setError,
    watch,
    setValue,
    formState: { isSubmitting, isDirty, isValid, errors },
  } = useForm<SyncHostConnectionRequest>({
    mode: 'onChange',
    defaultValues: { host: 'http://127.0.0.1:4003', roll: SyncRoll.Listener },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const onSubmit = async (formData: SyncHostConnectionRequest) => {
    try {
      await connectToHost(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    } finally {
      await refetch();
    }
  };

  const submitError = '';
  const disableSubmit = isSubmitting || !isValid;

  const onReset = () => {
    reset();
  };

  return (
    <>
      <Panel.Header>Machine Synchronization</Panel.Header>

      {list.length === 0 && (
        <Panel.Section
          as='form'
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(event) => preventEscape(event, onReset)}
          id='sync-settings'
        >
          <Panel.Card>
            <Panel.SubHeader>
              Connect to a host
              <Panel.InlineElements>
                <Button disabled={!isDirty || isSubmitting} variant='ghosted' onClick={onReset}>
                  Reset
                </Button>
                <Button
                  type='submit'
                  form='sync-settings'
                  name='sync-settings-submit'
                  loading={isSubmitting}
                  disabled={disableSubmit}
                  variant='primary'
                >
                  Connect
                </Button>
              </Panel.InlineElements>
            </Panel.SubHeader>
            {submitError && <Panel.Error>{submitError}</Panel.Error>}
            <Panel.Divider />
            <Panel.Section>
              <Panel.Loader isLoading={isLoading} />
              <Panel.ListGroup>
                <Panel.ListItem>
                  <Panel.Field title='Host' description='URL of the host ' error={errors.host?.message} />
                  <Input
                    id='host'
                    type='text'
                    style={{ width: '275px' }}
                    {...register('host', {
                      required: { value: true, message: 'Required field' },
                    })}
                  />
                </Panel.ListItem>
                <Panel.ListItem>
                  <Panel.Field
                    title='Roll'
                    description='Select whether to push or pull the project from the host'
                    error={errors.roll?.message}
                  />
                  <Select
                    value={watch('roll')}
                    onValueChange={(value: SyncRoll | null) => {
                      if (value === null) return;
                      setValue('roll', value, { shouldDirty: true });
                    }}
                    options={[
                      { value: SyncRoll.Controller, label: 'Controller' },
                      { value: SyncRoll.Listener, label: 'Listener' },
                    ]}
                  />
                </Panel.ListItem>
              </Panel.ListGroup>
            </Panel.Section>
          </Panel.Card>
        </Panel.Section>
      )}
      {list.length > 0 && (
        <Panel.Section>
          <Panel.Card>
            <Panel.SubHeader>
              Connect to a host
              <Panel.InlineElements>
                <Button disabled={!isDirty || isSubmitting} variant='ghosted' onClick={onReset}>
                  Reset
                </Button>
                <Button
                  type='submit'
                  form='sync-settings'
                  name='sync-settings-submit'
                  loading={isSubmitting}
                  disabled={disableSubmit}
                  variant='primary'
                >
                  Connect
                </Button>
              </Panel.InlineElements>
            </Panel.SubHeader>
            <Panel.Description>Description</Panel.Description>
            <Panel.Table>
              <thead>
                <tr>
                  <td>Client Name</td>
                  <td>Roll</td>
                  <td>Action</td>
                  <td>Host</td>
                </tr>
              </thead>
              <tbody>
                {list.map(({ id, name, roll, host }) => {
                  const isController = roll === SyncRoll.Controller;
                  const hostName = list.find(({ id }) => id === host)?.name;
                  return (
                    <tr key={id}>
                      <td> {name}</td>
                      <td> {roll}</td>
                      <Panel.InlineElements relation='inner' as='td'>
                        <Button
                          size='small'
                          disabled={isController}
                          variant='primary'
                          onClick={() => {
                            console.log('click');
                          }}
                        >
                          Promote To Controller
                        </Button>
                      </Panel.InlineElements>
                      <td> {hostName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Panel.Table>
          </Panel.Card>
        </Panel.Section>
      )}
    </>
  );
}
