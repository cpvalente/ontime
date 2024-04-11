import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button, IconButton, Input, Select, Switch } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { HttpSettings } from 'ontime-types';
import { generateId } from 'ontime-utils';

import { maybeAxiosError } from '../../../../common/api/utils';
import { useHttpSettings, usePostHttpSettings } from '../../../../common/hooks-query/useHttpSettings';
import { isKeyEscape } from '../../../../common/utils/keyEvent';
import { startsWithHttp } from '../../../../common/utils/regex';
import * as Panel from '../PanelUtils';

import { cycles } from './integrationUtils';

import style from './IntegrationsPanel.module.css';

export default function HttpIntegrations() {
  const { data, status } = useHttpSettings();
  const { mutateAsync } = usePostHttpSettings();

  const {
    control,
    handleSubmit,
    reset,
    register,
    setError,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<HttpSettings>({
    mode: 'onBlur',
    defaultValues: data,
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const { fields, prepend, remove } = useFieldArray({
    name: 'subscriptions',
    control,
  });

  const onSubmit = async (values: HttpSettings) => {
    try {
      await mutateAsync(values);
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    }
  };

  const preventEscape = (event: React.KeyboardEvent) => {
    if (isKeyEscape(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleAddNewSubscription = () => {
    prepend({
      id: generateId(),
      cycle: 'onLoad',
      message: '',
      enabled: false,
    });
  };

  const handleDeleteSubscription = (index: number) => {
    remove(index);
  };

  const canSubmit = !isSubmitting && isDirty && isValid;
  const isLoading = status === 'pending';

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>
          HTTP settings
          <div className={style.flex}>
            <Button variant='ontime-ghosted' size='sm' onClick={() => reset()} isDisabled={!canSubmit}>
              Revert to saved
            </Button>
            <Button
              variant='ontime-filled'
              size='sm'
              type='submit'
              form='http-form'
              isDisabled={!canSubmit}
              isLoading={isSubmitting}
            >
              Save
            </Button>
          </div>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section as='form' id='http-form' onSubmit={handleSubmit(onSubmit)} onKeyDown={preventEscape}>
          <Panel.Loader isLoading={isLoading} />
          {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='HTTP Output' description='Provide feedback from Ontime through HTTP' />
              <Controller
                control={control}
                name='enabledOut'
                render={({ field: { onChange, value, ref } }) => (
                  <Switch variant='ontime' size='lg' isChecked={value} onChange={onChange} ref={ref} />
                )}
              />
            </Panel.ListItem>
          </Panel.ListGroup>

          <Panel.Divider />

          <Panel.Title>
            HTTP Integration
            <Button variant='ontime-subtle' size='sm' rightIcon={<IoAdd />} onClick={handleAddNewSubscription}>
              New
            </Button>
          </Panel.Title>
          {fields.length > 0 && (
            <Panel.Table>
              <thead>
                <tr>
                  <th>Enabled</th>
                  <th>Cycle</th>
                  <th className={style.fullWidth}>Message</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {fields.map((integration, index) => {
                  // @ts-expect-error -- not sure why it is not finding the type, it is ok
                  const maybeError = errors.subscriptions?.[index]?.message?.message;
                  return (
                    <tr key={integration.id}>
                      <td>
                        <Switch variant='ontime' {...register(`subscriptions.${index}.enabled`)} />
                      </td>
                      <td className={style.autoWidth}>
                        <Select
                          size='sm'
                          variant='ontime'
                          className={style.fitContents}
                          {...register(`subscriptions.${index}.cycle`)}
                        >
                          {cycles.map((cycle) => (
                            <option key={cycle.id} value={cycle.value}>
                              {cycle.label}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className={style.fullWidth}>
                        <Input
                          size='sm'
                          variant='ontime-filled'
                          autoComplete='off'
                          placeholder='http://third-party/vt1/{{timer.current}}'
                          {...register(`subscriptions.${index}.message`, {
                            required: { value: true, message: 'Required field' },
                            pattern: {
                              value: startsWithHttp,
                              message: 'HTTP messages should start with http://',
                            },
                          })}
                        />
                        {maybeError && <Panel.Error>{maybeError}</Panel.Error>}
                      </td>
                      <td>
                        <IconButton
                          size='sm'
                          variant='ontime-ghosted'
                          color='#FA5656' // $red-500
                          icon={<IoTrash />}
                          aria-label='Delete entry'
                          onClick={() => handleDeleteSubscription(index)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Panel.Table>
          )}
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
