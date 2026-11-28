import { Query, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { IoRefresh } from 'react-icons/io5';

import Button from '../../../common/components/buttons/Button';
import EmptyPage from '../../../common/components/state/EmptyPage';
import { useTranslation } from '../../../translation/TranslationProvider';

import style from './ViewLoadError.module.scss';

const autoRetryInterval = 5000;
const isFailed = (query: Query) => query.state.status === 'error';

/**
 * Shown when a view could not fetch its data
 * keeps retrying in the background so the view recovers on its own once the server is reachable
 */
export default function ViewLoadError() {
  const queryClient = useQueryClient();
  const { getLocalizedString } = useTranslation();
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.refetchQueries({ type: 'active', predicate: isFailed }, { cancelRefetch: false });
    }, autoRetryInterval);
    return () => clearInterval(interval);
  }, [queryClient]);

  const retry = async () => {
    setIsRetrying(true);
    await queryClient.refetchQueries({ type: 'active', predicate: isFailed });
    setIsRetrying(false);
  };

  const errors = queryClient
    .getQueryCache()
    .findAll({ type: 'active', predicate: isFailed })
    .map((query) => describeError(query.state.error));

  return (
    <EmptyPage variant='error' text={getLocalizedString('common.data_error')}>
      <div className={style.actions}>
        <Button variant='subtle-white' size='large' onClick={retry} loading={isRetrying}>
          <IoRefresh aria-hidden /> {getLocalizedString('common.try_again')}
        </Button>
        {errors.length > 0 && (
          <details className={style.details}>
            <summary>{getLocalizedString('common.details')}</summary>
            <pre>{errors.join('\n')}</pre>
          </details>
        )}
      </div>
    </EmptyPage>
  );
}

function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const path = error.config?.url ? new URL(error.config.url, window.location.origin).pathname : '';
    return `${path} ${error.response?.status ?? error.message}`.trim();
  }
  return error instanceof Error ? error.message : String(error);
}
