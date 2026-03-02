import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PortInfo } from 'ontime-types';

import { getServerPort, postServerPort } from '../../../../common/api/settings';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import Tag from '../../../../common/components/tag/Tag';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { isOnlyNumbers } from '../../../../common/utils/regex';
import * as Panel from '../../panel-utils/PanelUtils';

interface ServerPortForm {
  serverPort: number;
}

export default function ServerPortSettings() {
  const {
    handleSubmit,
    register,
    reset,
    setError,
    formState: { isSubmitting, isDirty, isValid, errors },
  } = useForm<ServerPortForm>({
    mode: 'onChange',
    defaultValues: { serverPort: 4001 },
  });

  const [pendingRestart, setPendingRestart] = useState<boolean>(false);

  const setPort = useCallback((info: PortInfo) => {
    reset({ serverPort: info.port });
    setPendingRestart(info.pendingRestart);
  }, []);

  useEffect(() => {
    getServerPort()
      .then(setPort)
      .catch(() => setError('root', { message: 'Failed to load server port' }));
  }, [reset, setError, setPort]);

  const onSubmit = async (formData: ServerPortForm) => {
    if (formData.serverPort < 1024 || formData.serverPort > 65535) {
      setError('serverPort', { message: 'Port must be within range 1024 - 65535' });
      return;
    }
    try {
      await postServerPort(formData.serverPort);
      setPort(await getServerPort());
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    }
  };

  const onReset = async () => {
    try {
      setPort(await getServerPort());
    } catch (error) {
      setError('root', { message: 'Failed to load server port' });
    }
  };

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
            {pendingRestart && <Tag>A port change is pending and will happen on the next restart</Tag>}
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
        {errors.root && <Panel.Error>{errors.root.message}</Panel.Error>}
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
