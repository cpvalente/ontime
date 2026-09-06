import type { ReactNode } from 'react';
import { IoCheckmark, IoTrash } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Tag from '../../../../common/components/tag/Tag';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './AutomationForm.module.scss';

export type TestState = { status: 'sending' | 'ok' | 'error'; message?: string };

interface OutputCardProps {
  label: string;
  kindClass?: string;
  summary?: string;
  testState?: TestState;
  onTest: () => void;
  onDelete: () => void;
  children: ReactNode;
}

/**
 * Shared chrome for every output kind: the type tag and the actions live in the header,
 * so they stop competing with the form fields for grid columns
 */
export default function OutputCard({
  label,
  kindClass,
  summary,
  testState,
  onTest,
  onDelete,
  children,
}: OutputCardProps) {
  return (
    <div className={style.card}>
      <div className={style.cardHeader}>
        <Tag className={kindClass}>{label}</Tag>
        <span className={style.cardSummary}>{summary}</span>
        {testState?.status === 'ok' && (
          <span className={style.testOk}>
            <IoCheckmark />
            {testState.message}
          </span>
        )}
        <Button variant='ghosted-white' onClick={onTest} loading={testState?.status === 'sending'}>
          Test
        </Button>
        <IconButton aria-label='Delete output' variant='ghosted-destructive' onClick={onDelete}>
          <IoTrash />
        </IconButton>
      </div>
      {testState?.status === 'error' && <Panel.Error className={style.testError}>{testState.message}</Panel.Error>}
      <div className={style.cardBody}>{children}</div>
    </div>
  );
}
