import { Button, ButtonGroup } from '@chakra-ui/react';

import { AppMode, useAppMode } from '../../../common/stores/appModeStore';

import RundownMenu from './RundownMenu';

import style from './RundownHeader.module.scss';

import { useTranslation } from '../../../translation/TranslationProvider';

export default function RundownHeader() {
  const appMode = useAppMode((state) => state.mode);
  const setAppMode = useAppMode((state) => state.setMode);
  const setRunMode = () => setAppMode(AppMode.Run);
  const setEditMode = () => setAppMode(AppMode.Edit);
  const { getLocalizedString } = useTranslation();

  return (
    <div className={style.header}>
      <ButtonGroup isAttached>
        <Button size='sm' variant={appMode === AppMode.Run ? 'ontime-filled' : 'ontime-subtle'} onClick={setRunMode}>
        {getLocalizedString('editor.run')}
        </Button>
        <Button size='sm' variant={appMode === AppMode.Edit ? 'ontime-filled' : 'ontime-subtle'} onClick={setEditMode}>
        {getLocalizedString('editor.edit')}
        </Button>
      </ButtonGroup>
      <RundownMenu />
    </div>
  );
}
