import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { IoAdd } from 'react-icons/io5';
import { IoOpenOutline } from 'react-icons/io5';
import { IoTrash } from 'react-icons/io5';
import { Input } from '@chakra-ui/react';
import { URLPreset } from 'ontime-types';

import { postUrlPresets } from '../../../../common/api/urlPresets';
import { maybeAxiosError } from '../../../../common/api/utils';
import TooltipActionBtn from '../../../../common/components/buttons/TooltipActionBtn';
import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import { Alert } from '../../../../common/components/ui/alert';
import { Button } from '../../../../common/components/ui/button';
import { IconButton } from '../../../../common/components/ui/icon-button';
import { Switch } from '../../../../common/components/ui/switch';
import useUrlPresets from '../../../../common/hooks-query/useUrlPresets';
import { handleLinks } from '../../../../common/utils/linkUtils';
import { validateUrlPresetPath } from '../../../../common/utils/urlPresets';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './FeatureSettings.module.scss';

const urlPresetsDocs = 'https://docs.getontime.no/features/url-presets/';

type FormData = {
  data: URLPreset[];
};

export default function UrlPresetsForm() {
  const { data, status, refetch } = useUrlPresets();
  const {
    control,
    handleSubmit,
    register,
    reset,
    setError,
    formState: { isSubmitting, isDirty, isValid, errors },
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: { data },
    values: { data },
    resetOptions: {
      keepDirtyValues: true,
    },
  });
  const { fields, prepend, remove } = useFieldArray({
    name: 'data',
    control,
  });

  // reset form if we get new data from backend
  useEffect(() => {
    if (data) {
      reset({ data });
    }
  }, [data, reset]);

  const onSubmit = async (formData: FormData) => {
    for (let i = 0; i < formData.data.length; i++) {
      const preset = formData.data[i];
      const { isValid, message } = validateUrlPresetPath(preset.pathAndParams);
      if (!isValid) {
        setError(`data.${i}.pathAndParams`, { message });
        return;
      }
    }

    try {
      await postUrlPresets(formData.data);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    } finally {
      await refetch();
    }
  };

  const onReset = () => {
    reset({ data });
  };

  const addNew = () => {
    prepend({
      enabled: true,
      alias: '',
      pathAndParams: '',
    });
  };

  const isLoading = status === 'pending';
  const canSubmit = !isSubmitting && isDirty && isValid;

  return (
    <Panel.Section as='form' onSubmit={handleSubmit(onSubmit)} data-testid='url-preset-form'>
      <Panel.Card>
        <Panel.SubHeader>
          URL presets
          <div className={style.actionButtons}>
            <Button variant='ontime-ghosted' size='sm' onClick={onReset} disabled={!canSubmit}>
              Revert to saved
            </Button>
            <Button variant='ontime-filled' size='sm' type='submit' disabled={!canSubmit} loading={isSubmitting}>
              Save
            </Button>
          </div>
        </Panel.SubHeader>
        <Panel.Divider />
        <Alert
          status='info'
          title={
            <>
              URL presets are user defined aliases to Ontime URLs
              <br />
              <br />
              <b>Preset Name</b> <br />
              The alias for the URL. This will be the URL you will be calling. eg: <br />
              <Panel.BlockQuote>
                Preset name <Panel.Highlight>cam3</Panel.Highlight> called as{' '}
                <Panel.Highlight>http://localhost:4001/cam3</Panel.Highlight>
              </Panel.BlockQuote>
              <br />
              <b>URL Segment</b> <br />
              The corresponding alias path and configuration parameters. eg: <br />
              <Panel.BlockQuote>
                URL segment <Panel.Highlight>backstage?hidePast=true&stopCycle=true</Panel.Highlight> corresponds to
                complete URL
                <Panel.Highlight>http://localhost:4001/backstage?hidePast=true&stopCycle=true</Panel.Highlight>
              </Panel.BlockQuote>
              <br />
              You will need to save the changes before the presets are functional.
              <br />
              <ExternalLink href={urlPresetsDocs}>See the docs</ExternalLink>
            </>
          }
        />
        <Panel.Section>
          <Panel.Loader isLoading={isLoading} />
          <Panel.Title>
            Manage presets
            <Button variant='ontime-subtle' size='sm' onClick={addNew}>
              New <IoAdd />
            </Button>
          </Panel.Title>
          {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
          {errors?.data && <Panel.Error>{errors.data.message}</Panel.Error>}

          <Panel.Table>
            <thead>
              <tr>
                <th className={style.fit}>Active</th>
                <th className={style.aliasConstrain}>Preset name</th>
                <th className={style.fullWidth}>URL segment</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 && <Panel.TableEmpty handleClick={addNew} />}
              {fields.map((preset, index) => {
                const maybeAliasError = errors.data?.[index]?.alias?.message;
                const maybeUrlError = errors.data?.[index]?.pathAndParams?.message;
                // only saved and enabled URLs can be tested
                const canTest =
                  preset.alias && preset.enabled && preset.pathAndParams && !maybeAliasError && !maybeUrlError;

                return (
                  <tr key={preset.id}>
                    <td className={style.fit}>
                      <Controller
                        control={control}
                        name={`data.${index}.enabled`}
                        render={({ field: { onChange, value, ref } }) => (
                          <Switch size='lg' checked={value} onChange={onChange} ref={ref} />
                        )}
                      />
                    </td>
                    <td className={style.aliasConstrain}>
                      <Input
                        {...register(`data.${index}.alias`, {
                          required: { value: true, message: 'Required field' },
                        })}
                        size='sm'
                        variant='ontime-filled'
                        placeholder='URL Preset'
                        data-testid={`field__alias_${index}`}
                        autoComplete='off'
                      />
                      <Panel.Error>{maybeAliasError}</Panel.Error>
                    </td>
                    <td className={style.fullWidth}>
                      <Input
                        {...register(`data.${index}.pathAndParams`, {
                          required: { value: true, message: 'Required field' },
                        })}
                        size='sm'
                        variant='ontime-filled'
                        placeholder='URL (portion after ontime Port)'
                        data-testid={`field__url_${index}`}
                        autoComplete='off'
                      />
                      <Panel.Error>{maybeUrlError}</Panel.Error>
                    </td>
                    <td className={style.flex}>
                      <TooltipActionBtn
                        size='sm'
                        disabled={!canTest}
                        clickHandler={(event) => handleLinks(event, preset.alias)}
                        tooltip='Test preset'
                        aria-label='Test preset'
                        variant='ontime-ghosted'
                        color='#e2e2e2' // $gray-200
                        icon={<IoOpenOutline />}
                        data-testid={`field__test_${index}`}
                      />
                      <IconButton
                        size='sm'
                        onClick={() => remove(index)}
                        variant='ontime-ghosted'
                        color='#FA5656' // $red-500
                        aria-label='Delete entry'
                        data-testid={`field__delete_${index}`}
                      >
                        <IoTrash />
                      </IconButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Panel.Table>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
