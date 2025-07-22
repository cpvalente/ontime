import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import QRCode from 'react-qr-code';
import { OntimeView, URLPreset } from 'ontime-types';
import { generateId } from 'ontime-utils';

import { generateUrl } from '../../common/api/session';
import { postUrlPreset } from '../../common/api/urlPresets';
import { maybeAxiosError } from '../../common/api/utils';
import Button from '../../common/components/buttons/Button';
import Info from '../../common/components/info/Info';
import Select from '../../common/components/select/Select';
import Switch from '../../common/components/switch/Switch';
import copyToClipboard from '../../common/utils/copyToClipboard';
import { preventEscape } from '../../common/utils/keyEvent';
import { linkToOtherHost } from '../../common/utils/linkUtils';
import { isOntimeCloud, serverURL } from '../../externals';
import * as Panel from '../app-settings/panel-utils/PanelUtils';

import CuesheetLinkOptions from './composite/CuesheetLinkOptions';

import style from './GenerateLinkForm.module.scss';

interface GenerateLinkFormProps {
  hostOptions: { value: string; label: string }[];
  pathOptions: { value: OntimeView | string; label: string }[];
  isLockedToView?: boolean;
}

type GenericLinkOptions = {
  baseUrl: string;
  path: OntimeView | string; // we use empty string for Companion view
  lock: boolean;
  authenticate: boolean;
};

type CuesheetLinkOptions = {
  baseUrl: string;
  path: OntimeView.Cuesheet;
  options: {
    readPermissions?: string;
    writePermissions?: string;
  };
  lock: boolean;
  authenticate: boolean;
};

type GenerateLinkFormOptions = GenericLinkOptions | CuesheetLinkOptions;

type GenerateLinkState = 'pending' | 'loading' | 'success' | 'error';

export default function GenerateLinkForm({ hostOptions, pathOptions, isLockedToView }: GenerateLinkFormProps) {
  const [formState, setFormState] = useState<GenerateLinkState>('pending');
  const [url, setUrl] = useState(serverURL);
  const cuesheetReadRef = useRef<HTMLInputElement>(null);
  const cuesheetWriteRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    setError,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<GenerateLinkFormOptions>({
    mode: 'onChange',
    defaultValues: {
      baseUrl: serverURL,
      path: isLockedToView ? pathOptions[0].value : OntimeView.Timer,
      lock: false,
      authenticate: false,
    },
    resetOptions: {
      keepDirtyValues: true,
      keepValues: true,
    },
  });

  /**
   * If the user is generating a link to the cuesheet we gather extra options
   * The extra options are saved into a URL preset which we then request a share link for
   */
  const createPresetFromOptions = async (): Promise<URLPreset | undefined> => {
    const linkId = `cuesheet-${generateId()}`;
    const presets = await postUrlPreset({
      target: OntimeView.Cuesheet,
      enabled: true,
      alias: linkId,
      search: '',
      options: {
        readPermissions: cuesheetReadRef.current?.value ?? '',
        writePermissions: cuesheetWriteRef.current?.value ?? '',
      },
    });
    return presets.find((preset) => preset.alias === linkId);
  };

  const onSubmit = async (options: GenerateLinkFormOptions) => {
    try {
      setFormState('loading');
      if (options.path === OntimeView.Cuesheet) {
        const urlPreset = await createPresetFromOptions();
        if (!urlPreset) {
          throw new Error('Failed to create URL preset for Cuesheet');
        }
        const url = await generateUrl(options.baseUrl, urlPreset.alias, options.lock, options.authenticate);
        await copyToClipboard(url);
        setUrl(url);
      } else {
        const baseUrl = linkToOtherHost(options.baseUrl);
        const url = await generateUrl(baseUrl, options.path, options.lock, options.authenticate);
        await copyToClipboard(url);
        setUrl(url);
      }
      setFormState('success');
      reset();
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
      setFormState('error');
    }
  };

  console.log('base url', watch('baseUrl'));
  const canSubmit = isDirty || formState !== 'success';

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(event) => preventEscape(event)}>
      {errors.root && <Panel.Error>{errors.root.message}</Panel.Error>}
      {!isLockedToView && (
        <Info>You can generate a link to share with your team or to use in automation (such as companion).</Info>
      )}
      <Panel.ListGroup>
        {isOntimeCloud ? (
          <input hidden name='baseUrl' value={serverURL} />
        ) : (
          <Panel.ListItem>
            <Panel.Field
              title='Host IP'
              description={`Which IP address will be used${isOntimeCloud ? ' (not applicable in Ontime Cloud)' : ''}`}
            />
            <Select
              disabled={isOntimeCloud}
              options={hostOptions}
              value={watch('baseUrl')}
              onValueChange={(value) => setValue('baseUrl', value)}
            />
          </Panel.ListItem>
        )}
        {isLockedToView ? (
          <input type='hidden' value={watch('path')} />
        ) : (
          <Panel.ListItem>
            <Panel.Field title='Ontime view' description='Which view or preset will the link point to' />
            <Select options={pathOptions} value={watch('path')} onValueChange={(value) => setValue('path', value)} />
          </Panel.ListItem>
        )}

        {watch('path') === OntimeView.Cuesheet && (
          <CuesheetLinkOptions readRef={cuesheetReadRef} writeRef={cuesheetWriteRef} />
        )}

        <Panel.ListItem>
          <Panel.Field title='Lock navigation' description='Whether to hide the navigation menu' />
          <Switch
            size='large'
            name='lock'
            checked={watch('lock')}
            onCheckedChange={(checked) => setValue('lock', checked)}
          />
        </Panel.ListItem>
        <Panel.ListItem>
          <Panel.Field title='Authenticate' description='Whether the URL should be pre-authenticated' />
          <Switch
            size='large'
            name='authenticate'
            checked={watch('authenticate')}
            onCheckedChange={(checked) => setValue('authenticate', checked)}
          />
        </Panel.ListItem>
      </Panel.ListGroup>
      <Panel.ListGroup>
        <Panel.ListItem>
          <Panel.Field title='Generate link' description='Fill form and generate link and QR code' />
          <Button
            type='submit'
            variant={canSubmit ? 'primary' : 'subtle'}
            loading={formState === 'loading'}
            className={style.end}
          >
            {canSubmit ? 'Update share link' : 'Link copied to clipboard!'}
          </Button>
          {!isLockedToView && (
            <div className={style.column}>
              <QRCode size={172} value={url} className={style.qrCode} />
              <div className={style.copiableLink}>{url}</div>
            </div>
          )}
        </Panel.ListItem>
      </Panel.ListGroup>
    </form>
  );
}
