import { OntimeView, URLPreset } from 'ontime-types';
import { generateId } from 'ontime-utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { IoQrCodeOutline } from 'react-icons/io5';

import { generateUrl } from '../../common/api/session';
import { maybeAxiosError } from '../../common/api/utils';
import Button from '../../common/components/buttons/Button';
import CopyTag from '../../common/components/copy-tag/CopyTag';
import Input from '../../common/components/input/input/Input';
import QRCode from '../../common/components/qr-code/QrCode';
import Select from '../../common/components/select/Select';
import Switch from '../../common/components/switch/Switch';
import Tag from '../../common/components/tag/Tag';
import { useUpdateUrlPreset } from '../../common/hooks-query/useUrlPresets';
import { safeCopyToClipboard } from '../../common/utils/copyToClipboard';
import { preventEscape } from '../../common/utils/keyEvent';
import { isUrlSafe } from '../../common/utils/regex';
import { describePermission } from '../../common/utils/urlPresets';
import { isOntimeCloud, serverURL } from '../../externals';
import * as Panel from '../app-settings/panel-utils/PanelUtils';
import CuesheetLinkOptions, { CuesheetPermissionValues } from './composite/CuesheetLinkOptions';

import style from './GenerateLinkForm.module.scss';

interface GenerateLinkFormProps {
  hostOptions: { value: string; label: string }[];
  pathOptions: { value: OntimeView | string; label: string }[];
  presets: URLPreset[];
  /** whether the instance is password protected, links can only be pre-authenticated if it is */
  hasPassword?: boolean;
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

/** Snapshot of the options a link was created with, so the summary cannot drift from the link */
type CreatedLink = {
  url: string;
  view: string;
  lockNav: boolean;
  lockConfig: boolean;
  authenticate: boolean;
  permissions?: CuesheetPermissionValues;
};

export default function GenerateLinkForm({
  hostOptions,
  pathOptions,
  presets,
  hasPassword,
  isLockedToView,
}: GenerateLinkFormProps) {
  const [formState, setFormState] = useState<GenerateLinkState>('pending');
  const [created, setCreated] = useState<CreatedLink | null>(null);
  const [showCopied, setShowCopied] = useState(false);
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

  // the link is copied on creation, we show a transient confirmation so the side effect is visible
  useEffect(() => {
    if (!showCopied) return;
    const timeout = setTimeout(() => setShowCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [showCopied]);

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
      displayInNav: false,
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
    const viewLabel = pathOptions.find((option) => option.value === options.path)?.label ?? String(options.path);
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
        setCreated({
          url,
          view: viewLabel,
          lockNav: options.lockNav,
          lockConfig: options.lockConfig,
          authenticate: options.authenticate,
          permissions: cuesheetPermissions,
        });
      } else {
        const presetPath = options.path.startsWith('preset-') ? options.path.replace('preset-', '') : undefined;
        const path = presetPath ? presets.find((preset) => preset.alias === presetPath)?.target : options.path;
        if (!path) {
          throw new Error(`Could not resolve preset: ${presetPath}`);
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
        setCreated({
          url,
          view: viewLabel,
          lockNav: options.lockNav,
          lockConfig: options.lockConfig,
          authenticate: options.authenticate,
        });
      }
      setShowCopied(true);
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

  const isCuesheet = watch('path') === OntimeView.Cuesheet;
  const noReadAccess = isCuesheet && cuesheetPermissions.read === '-';
  const canSubmit = isDirty || formState !== 'success';
  // the options have moved on from the link we are showing
  const isStale = created !== null && formState !== 'loading' && (isDirty || formState === 'pending');

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(event) => preventEscape(event)}>
      <div className={style.shareInline}>
        <div className={style.column}>
          <Panel.Title>Destination</Panel.Title>
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
            {!isLockedToView && (
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
            {isCuesheet && (
              <Panel.ListItem>
                <Panel.Field
                  title='Preset alias'
                  description='Names the URL preset which holds these options'
                  error={(errors as FieldErrors<CuesheetLinkOptions>).alias?.message}
                />
                <Input
                  defaultValue={generatedAlias.current}
                  {...register('alias', {
                    required: 'Alias cannot be empty and must be unique',
                    pattern: {
                      value: isUrlSafe,
                      message: 'Field can only contain URL safe characters (a-z, 0-9, _ and -)',
                    },
                  })}
                />
              </Panel.ListItem>
            )}
          </Panel.ListGroup>

          {isCuesheet && (
            <>
              <Panel.Title>Permissions</Panel.Title>
              <Panel.ListGroup>
                <CuesheetLinkOptions onChange={handlePermissionsChange} />
              </Panel.ListGroup>
            </>
          )}

          <Panel.Title>Access</Panel.Title>
          <Panel.ListGroup>
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
            {!isCuesheet && (
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
            {/* pre-authenticating a link is only meaningful if the instance is password protected */}
            {hasPassword && (
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
            )}
          </Panel.ListGroup>
          <Panel.Error>{errors.root?.message}</Panel.Error>
          <Panel.InlineElements align='end' className={style.end}>
            <Button
              type='submit'
              variant={canSubmit ? 'primary' : 'subtle'}
              loading={formState === 'loading'}
              disabled={noReadAccess}
            >
              Create share link
            </Button>
          </Panel.InlineElements>
        </div>
        <Panel.Section className={style.column}>
          <Panel.Description>Share this link</Panel.Description>
          {created ? (
            <>
              <QRCode size={172} value={created.url} />
              <div className={style.copiableLink} data-testid='copy-link'>
                {created.url}
              </div>
              <Panel.InlineElements relation='inner' wrap='wrap'>
                <Tag>{created.view}</Tag>
                {created.lockNav && <Tag>Nav locked</Tag>}
                {created.lockConfig && <Tag>Config locked</Tag>}
                {created.authenticate && <Tag>Authenticated</Tag>}
                {created.permissions && (
                  <>
                    <Tag>Read: {describePermission(created.permissions.read)}</Tag>
                    <Tag>Write: {describePermission(created.permissions.write)}</Tag>
                  </>
                )}
                {isStale && <Tag variant='warning'>Options changed</Tag>}
              </Panel.InlineElements>
              <Panel.InlineElements relation='inner'>
                <CopyTag copyValue={created.url}>Copy link</CopyTag>
                {showCopied && <Tag>Copied</Tag>}
              </Panel.InlineElements>
            </>
          ) : (
            <div className={style.qrPlaceholder} aria-hidden>
              <IoQrCodeOutline />
            </div>
          )}
        </Panel.Section>
      </div>
    </form>
  );
}
