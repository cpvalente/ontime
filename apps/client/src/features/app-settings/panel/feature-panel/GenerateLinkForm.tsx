import { useState } from 'react';
import { useForm } from 'react-hook-form';
import QRCode from 'react-qr-code';

import { generateUrl } from '../../../../common/api/session';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import Select from '../../../../common/components/select/Select';
import Switch from '../../../../common/components/switch/Switch';
import copyToClipboard from '../../../../common/utils/copyToClipboard';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { linkToOtherHost } from '../../../../common/utils/linkUtils';
import { currentHostName, isOntimeCloud, serverURL } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './GenerateLinkForm.module.scss';

interface GenerateLinkFormProps {
  hostOptions: { value: string; label: string }[];
  pathOptions: { value: string; label: string }[];
  isLockedToView?: boolean;
}

interface GenerateLinkFormOptions {
  baseUrl: string;
  path: string;
  lock: boolean;
  authenticate: boolean;
}

type GenerateLinkState = 'pending' | 'loading' | 'success' | 'error';

export default function GenerateLinkForm({ hostOptions, pathOptions, isLockedToView }: GenerateLinkFormProps) {
  const [formState, setFormState] = useState<GenerateLinkState>('pending');
  const [url, setUrl] = useState(serverURL);

  const {
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GenerateLinkFormOptions>({
    mode: 'onChange',
    defaultValues: {
      baseUrl: currentHostName,
      path: isLockedToView ? pathOptions[0].value : 'timer',
      lock: false,
      authenticate: false,
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const onSubmit = async (options: GenerateLinkFormOptions) => {
    try {
      setFormState('loading');
      const baseUrl = linkToOtherHost(options.baseUrl);
      const url = await generateUrl(baseUrl, options.path, options.lock, options.authenticate);
      await copyToClipboard(url);
      setUrl(url);
      setFormState('success');
      setTimeout(() => {
        setFormState('pending');
      }, 4000);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
      setFormState('error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(event) => preventEscape(event)}>
      {errors.root && <Panel.Error>{errors.root.message}</Panel.Error>}
      {!isLockedToView ? (
        <Info>You can generate a link to share with your team or to use in automation (such as companion).</Info>
      ) : (
        <Info>You can generate a link to share with your team</Info>
      )}
      <Panel.ListGroup>
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
        {isLockedToView ? (
          <input type='hidden' value={watch('path')} />
        ) : (
          <Panel.ListItem>
            <Panel.Field title='Ontime view' description='Which view or preset will the link point to' />
            <Select options={pathOptions} value={watch('path')} onValueChange={(value) => setValue('path', value)} />
          </Panel.ListItem>
        )}

        <Panel.ListItem>
          <Panel.Field
            title='Lock navigation'
            description='Prevent showing navigation (will only work for non production URLs)'
          />
          <Switch name='lock' checked={watch('lock')} onCheckedChange={(checked) => setValue('lock', checked)} />
        </Panel.ListItem>
        <Panel.ListItem>
          <Panel.Field title='Authenticate' description='Whether the URL should be pre-authenticated' />
          <Switch
            name='authenticate'
            checked={watch('authenticate')}
            onCheckedChange={(checked) => setValue('authenticate', checked)}
          />
        </Panel.ListItem>
      </Panel.ListGroup>
      <Panel.ListGroup>
        <Panel.ListItem>
          <Panel.Field title='Generate link' description='Fill form and generate link and QR code' />
          <Button variant='primary' loading={formState === 'loading'} type='submit' style={{ alignSelf: 'end' }}>
            {formState === 'success' ? 'Link copied to clipboard!' : 'Update share link'}
          </Button>
          <div className={style.column}>
            <QRCode size={172} value={url} className={style.qrCode} />
            <div className={style.copiableLink}>{url}</div>
          </div>
        </Panel.ListItem>
      </Panel.ListGroup>
    </form>
  );
}
