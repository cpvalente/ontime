import { memo } from 'react';

import CopyTag from '../../../../common/components/copy-tag/CopyTag';

import style from './EventEditorFooter.module.scss';

interface EventEditorFooterProps {
  id: string;
  cue: string;
}

export const EventEditorFooter = memo(_EventEditorFooter);

function _EventEditorFooter(props: EventEditorFooterProps) {
  const { id, cue } = props;

  const loadById = `/ontime/load/id "${id}"`;
  const loadByCue = `/ontime/load/cue "${cue}"`;

  return (
    <div className={style.footer}>
      <CopyTag copyValue={loadById} label='OSC trigger by ID'>
        {loadById}
      </CopyTag>
      <CopyTag copyValue={loadByCue} label='OSC trigger by cue'>
        {loadByCue}
      </CopyTag>
    </div>
  );
}
