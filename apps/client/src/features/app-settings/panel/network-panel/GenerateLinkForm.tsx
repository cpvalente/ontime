import { useState } from 'react';
import { useForm } from 'react-hook-form';
import QRCode from 'react-qr-code';
import { Button, Select, Switch } from '@chakra-ui/react';

import { generateUrl } from '../../../../common/api/session';
import { maybeAxiosError } from '../../../../common/api/utils';
import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import Info from '../../../../common/components/info/Info';
import useInfo from '../../../../common/hooks-query/useInfo';
import useUrlPresets from '../../../../common/hooks-query/useUrlPresets';
import copyToClipboard from '../../../../common/utils/copyToClipboard';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { linkToOtherHost } from '../../../../common/utils/linkUtils';
import { serverURL } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './GenerateLinkForm.module.scss';

interface GenerateLinkFormOptions {
  baseUrl: string;
  path: string;
  lock: boolean;
  authenticate: boolean;
}

type GenerateLinkState = 'pending' | 'loading' | 'success' | 'error';

export default function GenerateLinkForm() {
  const { data: infoData } = useInfo();
  const { data: urlPresetData } = useUrlPresets();
  const [formState, setFormState] = useState<GenerateLinkState>('pending');
  const [url, setUrl] = useState(serverURL);

  const {
    handleSubmit,
    register,
    setError,
    formState: { errors },
  } = useForm<GenerateLinkFormOptions>({
    mode: 'onChange',
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
    <Panel.Section as='form' onSubmit={handleSubmit(onSubmit)} onKeyDown={(event) => preventEscape(event)}>
      {errors.root && <Panel.Error>{errors.root.message}</Panel.Error>}
      <Info>
        <Panel.Paragraph>
          You can generate a link to share with your team or to use in automation (such as companion).
        </Panel.Paragraph>
      </Info>
      <Panel.ListGroup>
        <Panel.ListItem>
          <Panel.Field title='Host IP' description='Which IP address will be used' />
          <Select variant='ontime' size='sm' {...register('baseUrl')}>
            {infoData.networkInterfaces.map((nif) => {
              return (
                <option key={nif.name} value={nif.address}>
                  {`${nif.name} - ${nif.address}`}
                </option>
              );
            })}
          </Select>
        </Panel.ListItem>
        <Panel.ListItem>
          <Panel.Field
            title='URL Preset'
            description='Which preset will the link point to (will default to /timer if none is given)'
          />
          <Select variant='ontime' size='sm' {...register('path')}>
            <option key='timer' value='timer'>
              Timer
            </option>
            {urlPresetData.map((preset) => {
              return (
                <option key={preset.alias} value={preset.alias}>
                  {`Preset: ${preset.alias}`}
                </option>
              );
            })}
          </Select>
        </Panel.ListItem>
        <Panel.ListItem>
          <Panel.Field
            title='Lock navigation'
            description='Prevent showing navigation (will only work for non production URLs)'
          />
          <Switch variant='ontime' size='lg' {...register('lock')} />
        </Panel.ListItem>
        <Panel.ListItem>
          <Panel.Field title='Authenticate' description='Whether the URL should be pre-authenticated' />
          <Switch variant='ontime' size='lg' {...register('authenticate')} />
        </Panel.ListItem>
      </Panel.ListGroup>
      <Panel.ListGroup>
        <Panel.ListItem>
          <Panel.Field title='Generate link' description='Fill form and generate link and QR code' />
          <Button
            variant='ontime-filled'
            size='sm'
            isLoading={formState === 'loading'}
            type='submit'
            style={{ alignSelf: 'end' }}
          >
            {formState === 'success' ? 'Link copied to clipboard!' : 'Update share link'}
          </Button>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <QRCode size={172} value={url} className={style.qrCode} />
            <ExternalLink href={url}>{url}</ExternalLink>
          </div>
        </Panel.ListItem>
      </Panel.ListGroup>
    </Panel.Section>
  );
}
