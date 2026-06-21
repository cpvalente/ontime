import { OntimeView, URLPreset } from 'ontime-types';
import { generateId } from 'ontime-utils';
import { useCallback, useRef, useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';

import { generateUrl } from '../../common/api/session';
import { maybeAxiosError } from '../../common/api/utils';
import Button from '../../common/components/buttons/Button';
import CopyTag from '../../common/components/copy-tag/CopyTag';
import Info from '../../common/components/info/Info';
import Input from '../../common/components/input/input/Input';
import QRCode from '../../common/components/qr-code/QrCode';
import Select from '../../common/components/select/Select';
import Switch from '../../common/components/switch/Switch';
import { useUpdateUrlPreset } from '../../common/hooks-query/useUrlPresets';
import { safeCopyToClipboard } from '../../common/utils/copyToClipboard';
import { preventEscape } from '../../common/utils/keyEvent';
import { isUrlSafe } from '../../common/utils/regex';
import { isOntimeCloud, serverURL } from '../../externals';
import * as Panel from '../app-settings/panel-utils/PanelUtils';
import CuesheetLinkOptions, { CuesheetPermissionValues } from './composite/CuesheetLinkOptions';

import style from './GenerateLinkForm.module.scss';

interface GenerateLinkFormProps {
  hostOptions: { value: string; label: string }[];
  pathOptions: { value: OntimeView | string; label: string }[];
  presets: URLPreset[];
  isLockedToView?: boolean;
}

type GenericLinkOptions = {
  baseUrl: string;
  path: OntimeView | string; // we use empty string for Companion view
  authenticate: boolean;
  lockConfig: boolean;
  lockNav: boolean;
};

type CuesheetLinkOptions = GenericLinkOptions & {
  path: OntimeView.Cuesheet;

  alias: string;
  options: {
    read?: string;
    write?: string;
  };
};

type GenerateLinkFormOptions = GenericLinkOptions | CuesheetLinkOptions;

type GenerateLinkState = 'pending' | 'loading' | 'success' | 'error';

export default function GenerateLinkForm({ hostOptions, pathOptions, presets, isLockedToView }: GenerateLinkFormProps) {
  const [formState, setFormState] = useState<GenerateLinkState>('pending');
  const [url, setUrl] = useState('');
  const [cuesheetPermissions, setCuesheetPermissions] = useState<CuesheetPermissionValues>({
    read: 'full',
    write: 'full',
  });
  const generatedAlias = useRef<string>(`cuesheet-${generateId()}`);

  const { addPreset, updatePreset } = useUpdateUrlPreset();
  // Tracks the alias we already created this session so re-generating updates rather than duplicates it
  const createdAlias = useRef<string | null>(null);

  /**
   * Permissions live outside react-hook-form, so we reset a successful state manually
   * whenever they change - this re-arms the "Create share link" button as the previous
   * link no longer reflects the selected permissions.
   */
  const handlePermissionsChange = useCallback((permissions: CuesheetPermissionValues) => {
    setCuesheetPermissions(permissions);
    setFormState((current) => (current === 'success' ? 'pending' : current));
  }, []);

  const {
    handleSubmit,
    setError,
    watch,
    setValue,
    reset,
    register,
    formState: { errors, isDirty },
  } = useForm<GenerateLinkFormOptions>({
    mode: 'onChange',
    defaultValues: {
      baseUrl: serverURL,
      path: isLockedToView ? pathOptions[0].value : OntimeView.Timer,
      authenticate: false,
      lockConfig: false,
      lockNav: false,
    },
  });

  /**
   * If the user is generating a link to the cuesheet we gather extra options
   * The extra options are saved into a URL preset which we then request a share link for
   */
  const createPresetFromOptions = async (
    alias: string,
    options: Required<CuesheetLinkOptions['options']>,
  ): Promise<URLPreset | undefined> => {
    if (options.read === '-') {
      throw new Error('Cannot create a share with no read permissions');
    }
    const payload = {
      target: OntimeView.Cuesheet,
      enabled: true,
      alias,
      search: '',
      options: {
        read: options.read,
        write: options.write,
      },
    } as const;
    // Re-generating with the same name updates the existing preset instead of failing on a duplicate alias
    const presets = createdAlias.current === alias ? await updatePreset(alias, payload) : await addPreset(payload);
    createdAlias.current = alias;
    return presets.find((preset) => preset.alias === alias);
  };

  const onSubmit = async (options: GenerateLinkFormOptions) => {
    try {
      setFormState('loading');
      if (options.path === OntimeView.Cuesheet) {
        const urlPreset = await createPresetFromOptions((options as CuesheetLinkOptions).alias, {
          read: cuesheetPermissions.read,
          write: cuesheetPermissions.write,
        });

        if (!urlPreset) {
          throw new Error('Failed to create URL preset for Cuesheet');
        }

        const url = await generateUrl({
          baseUrl: options.baseUrl,
          path: options.path,
          authenticate: options.authenticate,
          lockConfig: options.lockConfig,
          lockNav: options.lockNav,
          preset: urlPreset.alias,
        });
        await safeCopyToClipboard(url);
        setUrl(url);
      } else {
        const presetPath = options.path.startsWith('preset-') ? options.path.replace('preset-', '') : undefined;
        const path = presetPath ? presets.find((preset) => preset.alias === presetPath)?.target : options.path;
        if (!path) {
          throw new Error(`Could not resolve preset: ${path}`);
        }

        const url = await generateUrl({
          baseUrl: options.baseUrl,
          path,
          authenticate: options.authenticate,
          lockConfig: options.lockConfig,
          lockNav: options.lockNav,
          preset: presetPath,
        });

        await safeCopyToClipboard(url);
        setUrl(url);
      }
      reset(options, {
        keepValues: true,
        keepDirty: false,
      });
      setFormState('success');
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
      setFormState('error');
    }
  };

  const noReadAccess = watch('path') === OntimeView.Cuesheet && cuesheetPermissions.read === '-';
  const canSubmit = isDirty || formState !== 'success';

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(event) => preventEscape(event)}>
      {!isLockedToView && (
        <Info>You can generate a link to share with your team or to use in automation (such as companion).</Info>
      )}
      <div className={style.shareInline}>
        <div className={style.column}>
          <Panel.ListGroup>
            {isOntimeCloud ? (
              <input hidden readOnly name='baseUrl' value={serverURL} />
            ) : (
              <Panel.ListItem>
                <Panel.Field
                  title='Host IP'
                  description={`Which IP address will be used${isOntimeCloud ? ' (not applicable in Ontime Cloud)' : ''}`}
                />
                <Select
                  options={hostOptions}
                  value={watch('baseUrl')}
                  onValueChange={(value: string | null) => {
                    if (value === null) return;
                    setValue('baseUrl', value);
                  }}
                />
              </Panel.ListItem>
            )}
            {isLockedToView ? (
              <input type='hidden' value={watch('path')} />
            ) : (
              <Panel.ListItem>
                <Panel.Field title='Ontime view' description='Which view or preset will the link point to' />
                <Select
                  options={pathOptions}
                  value={watch('path')}
                  onValueChange={(value: OntimeView | string | null) => {
                    if (value === null) return;
                    setValue('path', value, { shouldDirty: true });
                  }}
                />
              </Panel.ListItem>
            )}

            {watch('path') === OntimeView.Cuesheet && (
              <>
                <Panel.ListItem>
                  <Panel.Field
                    title='Link name'
                    description='A name to identify this shared link. You can manage links later in Settings → URL presets'
                    error={(errors as FieldErrors<CuesheetLinkOptions>).alias?.message}
                  />
                  <Input
                    defaultValue={generatedAlias.current}
                    {...register('alias', {
                      required: 'Name cannot be empty and must be unique',
                      pattern: {
                        value: isUrlSafe,
                        message: 'Field can only contain URL safe characters (a-z, 0-9, _ and -)',
                      },
                    })}
                  />
                </Panel.ListItem>
                <CuesheetLinkOptions onChange={handlePermissionsChange} />
              </>
            )}

            <Panel.ListItem>
              <Panel.Field title='Lock navigation' description='Whether to hide the navigation menu' />
              <Switch
                size='large'
                name='lockNav'
                data-testid='lockNav'
                checked={watch('lockNav')}
                onCheckedChange={(checked) => setValue('lockNav', checked, { shouldDirty: true })}
                disabled={watch('lockConfig')}
              />
            </Panel.ListItem>
            {watch('path') !== OntimeView.Cuesheet && (
              <Panel.ListItem>
                <Panel.Field
                  title='Lock configuration'
                  description='Whether to hide the configuration panel (also hides navigation)'
                />
                <Switch
                  size='large'
                  name='lockConfig'
                  data-testid='lockConfig'
                  checked={watch('lockConfig')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setValue('lockNav', checked, { shouldDirty: true });
                    }
                    setValue('lockConfig', checked, { shouldDirty: true });
                  }}
                />
              </Panel.ListItem>
            )}
            <Panel.ListItem>
              <Panel.Field title='Authenticate' description='Whether the URL should be pre-authenticated' />
              <Switch
                size='large'
                name='authenticate'
                data-testid='authenticate'
                checked={watch('authenticate')}
                onCheckedChange={(checked) => setValue('authenticate', checked, { shouldDirty: true })}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
          <Panel.Error>{errors.root?.message}</Panel.Error>
          <Panel.InlineElements align='end' className={style.end}>
            <Button
              type='submit'
              variant={canSubmit ? 'primary' : 'subtle'}
              loading={formState === 'loading'}
              disabled={noReadAccess}
            >
              {canSubmit ? 'Create share link' : 'Link copied to clipboard!'}
            </Button>
          </Panel.InlineElements>
        </div>
        <Panel.Section className={style.column}>
          <Panel.Description>Share this link</Panel.Description>
          {url ? (
            <>
              <QRCode size={172} value={url} />
              <div className={style.copiableLink} data-testid='copy-link'>
                {url}
              </div>
              <CopyTag copyValue={url}>Copy link</CopyTag>
            </>
          ) : (
            <div className={style.placeholder}>Your link will appear here once you create it.</div>
          )}
        </Panel.Section>
      </div>
    </form>
  );
}
