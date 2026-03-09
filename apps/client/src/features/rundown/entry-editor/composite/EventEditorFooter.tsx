import { memo } from 'react';

import CopyTag from '../../../../common/components/copy-tag/CopyTag';

import style from './EventEditorFooter.module.scss';

interface EventEditorFooterProps {
  id?: string;
  cue?: string;
  selectedCount?: number;
}

export default memo(EventEditorFooter);
function EventEditorFooter({ id, cue, selectedCount }: EventEditorFooterProps) {
  if (selectedCount) {
    return (
      <div className={style.selectionFooter}>
        <span className={style.selectionLabel}>Batch Edit: {selectedCount} events selected</span>
      </div>
    );
  }

  const loadById = `/ontime/load/id "${id}"`;
  const loadByCue = `/ontime/load/cue "${cue}"`;

  return (
    <div className={style.footer}>
      <CopyTag copyValue={loadById}>{loadById}</CopyTag>
      <CopyTag copyValue={loadByCue}>{loadByCue}</CopyTag>
    </div>
  );
}
